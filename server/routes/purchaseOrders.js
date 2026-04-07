const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { status, vendor_id } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`po.status = $${idx++}`); params.push(status); }
    if (vendor_id) { conditions.push(`po.vendor_id = $${idx++}`); params.push(vendor_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT po.*, v.name as vendor_name, u.name as created_by_name,
        COUNT(poi.id) as item_count
       FROM purchase_orders po
       LEFT JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN users u ON u.id = po.created_by
       LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
       ${where}
       GROUP BY po.id, v.name, u.name
       ORDER BY po.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { vendor_id, expected_delivery, notes, items } = req.body;
    const result = await pool.query(
      `INSERT INTO purchase_orders (vendor_id, status, order_date, expected_delivery, notes, created_by)
       VALUES ($1, 'draft', CURRENT_DATE, $2, $3, $4) RETURNING *`,
      [vendor_id, expected_delivery, notes, req.user.id]
    );
    const po = result.rows[0];

    let totalCost = 0;
    if (items?.length > 0) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO purchase_order_items (purchase_order_id, inventory_item_id, quantity_ordered, unit_cost)
           VALUES ($1,$2,$3,$4)`,
          [po.id, item.inventory_item_id, item.quantity, item.unit_cost]
        );
        totalCost += (item.quantity * item.unit_cost);
      }
      await pool.query('UPDATE purchase_orders SET total_cost = $1 WHERE id = $2', [totalCost, po.id]);
    }

    res.status(201).json({ ...po, total_cost: totalCost });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { status, expected_delivery, notes } = req.body;
    const result = await pool.query(
      `UPDATE purchase_orders SET
        status = COALESCE($1, status),
        expected_delivery = COALESCE($2, expected_delivery),
        notes = COALESCE($3, notes),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, expected_delivery, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'PO not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/receive', authenticate, async (req, res, next) => {
  try {
    const poId = req.params.id;
    const { items } = req.body;

    for (const item of items) {
      await pool.query(
        `UPDATE purchase_order_items SET quantity_received = quantity_received + $1
         WHERE purchase_order_id = $2 AND inventory_item_id = $3`,
        [item.quantity_received, poId, item.inventory_item_id]
      );
      await pool.query(
        `UPDATE stock_levels SET
          qty_in_back = qty_in_back + $1,
          qty_in_transit = GREATEST(qty_in_transit - $1, 0),
          updated_at = NOW()
         WHERE inventory_item_id = $2`,
        [item.quantity_received, item.inventory_item_id]
      );
      await pool.query(
        `INSERT INTO stock_movements (inventory_item_id, movement_type, quantity, from_location, to_location, reference_type, reference_id, created_by)
         VALUES ($1, 'received', $2, 'transit', 'back', 'purchase_order', $3, $4)`,
        [item.inventory_item_id, item.quantity_received, poId, req.user.id]
      );
    }

    const allReceived = await pool.query(
      `SELECT SUM(quantity_ordered) as ordered, SUM(quantity_received) as received
       FROM purchase_order_items WHERE purchase_order_id = $1`,
      [poId]
    );
    const { ordered, received } = allReceived.rows[0];
    const newStatus = parseInt(received) >= parseInt(ordered) ? 'received' : 'partial';
    await pool.query(
      `UPDATE purchase_orders SET status = $1, actual_delivery = CASE WHEN $1 = 'received' THEN CURRENT_DATE ELSE actual_delivery END, updated_at = NOW() WHERE id = $2`,
      [newStatus, poId]
    );

    res.json({ message: 'Items received', status: newStatus });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
