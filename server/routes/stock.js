const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.put('/:itemId', authenticate, async (req, res, next) => {
  try {
    const { qty_on_shelf, qty_in_back, qty_in_transit, qty_reserved_csa, reorder_point } = req.body;
    const result = await pool.query(
      `UPDATE stock_levels SET
        qty_on_shelf = COALESCE($1, qty_on_shelf),
        qty_in_back = COALESCE($2, qty_in_back),
        qty_in_transit = COALESCE($3, qty_in_transit),
        qty_reserved_csa = COALESCE($4, qty_reserved_csa),
        reorder_point = COALESCE($5, reorder_point),
        updated_at = NOW()
       WHERE inventory_item_id = $6 RETURNING *`,
      [qty_on_shelf, qty_in_back, qty_in_transit, qty_reserved_csa, reorder_point, req.params.itemId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Stock record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:itemId/move', authenticate, async (req, res, next) => {
  try {
    const { from_location, to_location, quantity, notes } = req.body;
    const itemId = req.params.itemId;

    if (!from_location || !to_location || !quantity) {
      return res.status(400).json({ error: 'from_location, to_location, and quantity are required' });
    }

    const colMap = { shelf: 'qty_on_shelf', back: 'qty_in_back', transit: 'qty_in_transit' };
    const fromCol = colMap[from_location];
    const toCol = colMap[to_location];
    if (!fromCol || !toCol) return res.status(400).json({ error: 'Invalid location' });

    const stock = await pool.query('SELECT * FROM stock_levels WHERE inventory_item_id = $1', [itemId]);
    if (stock.rows.length === 0) return res.status(404).json({ error: 'Stock record not found' });
    if (stock.rows[0][fromCol] < quantity) {
      return res.status(400).json({ error: `Not enough stock in ${from_location}` });
    }

    await pool.query(
      `UPDATE stock_levels SET ${fromCol} = ${fromCol} - $1, ${toCol} = ${toCol} + $1, updated_at = NOW()
       WHERE inventory_item_id = $2`,
      [quantity, itemId]
    );

    await pool.query(
      `INSERT INTO stock_movements (inventory_item_id, movement_type, quantity, from_location, to_location, reference_type, notes, created_by)
       VALUES ($1, 'moved', $2, $3, $4, 'manual', $5, $6)`,
      [itemId, quantity, from_location, to_location, notes || null, req.user.id]
    );

    const updated = await pool.query('SELECT * FROM stock_levels WHERE inventory_item_id = $1', [itemId]);
    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:itemId/receive', authenticate, async (req, res, next) => {
  try {
    const { quantity, to_location = 'back', notes } = req.body;
    const itemId = req.params.itemId;
    const colMap = { shelf: 'qty_on_shelf', back: 'qty_in_back' };
    const toCol = colMap[to_location];
    if (!toCol) return res.status(400).json({ error: 'Invalid to_location' });

    await pool.query(
      `UPDATE stock_levels SET
        qty_in_transit = GREATEST(qty_in_transit - $1, 0),
        ${toCol} = ${toCol} + $1,
        updated_at = NOW()
       WHERE inventory_item_id = $2`,
      [quantity, itemId]
    );

    await pool.query(
      `INSERT INTO stock_movements (inventory_item_id, movement_type, quantity, from_location, to_location, reference_type, notes, created_by)
       VALUES ($1, 'received', $2, 'transit', $3, 'manual', $4, $5)`,
      [itemId, quantity, to_location, notes || null, req.user.id]
    );

    const updated = await pool.query('SELECT * FROM stock_levels WHERE inventory_item_id = $1', [itemId]);
    res.json(updated.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/movements', async (req, res, next) => {
  try {
    const { item_id, type, limit = 50 } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (item_id) {
      conditions.push(`sm.inventory_item_id = $${idx++}`);
      params.push(item_id);
    }
    if (type) {
      conditions.push(`sm.movement_type = $${idx++}`);
      params.push(type);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT sm.*, i.item_name, i.brand, u.name as user_name
       FROM stock_movements sm
       JOIN inventory_items i ON i.id = sm.inventory_item_id
       LEFT JOIN users u ON u.id = sm.created_by
       ${where}
       ORDER BY sm.created_at DESC
       LIMIT $${idx}`,
      [...params, parseInt(limit)]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
