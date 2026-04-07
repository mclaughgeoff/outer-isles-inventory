const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT v.*,
        COUNT(DISTINCT i.id) as item_count
       FROM vendors v
       LEFT JOIN inventory_items i ON i.distributor = v.name AND i.is_active = true
       GROUP BY v.id ORDER BY v.name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const vendor = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (vendor.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });

    const items = await pool.query(
      `SELECT i.id, i.item_name, i.brand, i.size, i.wholesale_cost, i.retail_price
       FROM inventory_items i WHERE i.distributor = $1 AND i.is_active = true
       ORDER BY i.item_name`,
      [vendor.rows[0].name]
    );
    res.json({ ...vendor.rows[0], items: items.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, delivery_minimum, shipping_policy, contact_info, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO vendors (name, delivery_minimum, shipping_policy, contact_info, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, delivery_minimum, shipping_policy, contact_info || {}, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
