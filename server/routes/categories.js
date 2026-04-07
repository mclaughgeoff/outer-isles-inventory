const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(i.id) as item_count
       FROM categories c
       LEFT JOIN inventory_items i ON i.category_id = c.id AND i.is_active = true
       GROUP BY c.id
       ORDER BY c.display_order`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, display_order } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING *',
      [name, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, display_order } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), display_order = COALESCE($2, display_order), updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, display_order, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
