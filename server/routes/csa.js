const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Members
router.get('/members', async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM csa_members ORDER BY name');
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/members', async (req, res, next) => {
  try {
    const { name, email, phone, subscription_status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO csa_members (name, email, phone, subscription_status, start_date, notes)
       VALUES ($1,$2,$3,$4,CURRENT_DATE,$5) RETURNING *`,
      [name, email || null, phone || null, subscription_status || 'active', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/members/:id', async (req, res, next) => {
  try {
    const { name, email, phone, subscription_status, notes } = req.body;
    const result = await pool.query(
      `UPDATE csa_members SET
        name = COALESCE($1, name), email = COALESCE($2, email),
        phone = COALESCE($3, phone), subscription_status = COALESCE($4, subscription_status),
        notes = COALESCE($5, notes)
       WHERE id = $6 RETURNING *`,
      [name, email, phone, subscription_status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Member not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// Weekly Boxes
router.get('/boxes', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT b.*, COUNT(bi.id) as item_count
       FROM csa_weekly_boxes b
       LEFT JOIN csa_box_items bi ON bi.csa_box_id = b.id
       GROUP BY b.id ORDER BY b.week_start DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/boxes', async (req, res, next) => {
  try {
    const { name, week_start, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO csa_weekly_boxes (name, week_start, status, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, week_start, status || 'draft', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/boxes/:id', async (req, res, next) => {
  try {
    const { name, week_start, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE csa_weekly_boxes SET
        name = COALESCE($1, name), week_start = COALESCE($2, week_start),
        status = COALESCE($3, status), notes = COALESCE($4, notes), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, week_start, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Box not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.get('/boxes/:id', async (req, res, next) => {
  try {
    const box = await pool.query('SELECT * FROM csa_weekly_boxes WHERE id = $1', [req.params.id]);
    if (box.rows.length === 0) return res.status(404).json({ error: 'Box not found' });

    const items = await pool.query(
      `SELECT bi.id, bi.inventory_item_id, bi.quantity,
        i.item_name, i.brand, i.size,
        (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available
       FROM csa_box_items bi
       JOIN inventory_items i ON i.id = bi.inventory_item_id
       LEFT JOIN stock_levels s ON s.inventory_item_id = i.id
       WHERE bi.csa_box_id = $1`,
      [req.params.id]
    );

    const members = await pool.query(
      "SELECT COUNT(*) FROM csa_members WHERE subscription_status = 'active'"
    );

    res.json({
      ...box.rows[0],
      items: items.rows,
      active_member_count: parseInt(members.rows[0].count),
    });
  } catch (err) { next(err); }
});

router.post('/boxes/:id/items', async (req, res, next) => {
  try {
    const { inventory_item_id, quantity } = req.body;
    const result = await pool.query(
      'INSERT INTO csa_box_items (csa_box_id, inventory_item_id, quantity) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, inventory_item_id, quantity || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/boxes/:boxId/items/:itemId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM csa_box_items WHERE id = $1', [req.params.itemId]);
    res.json({ message: 'Removed' });
  } catch (err) { next(err); }
});

module.exports = router;
