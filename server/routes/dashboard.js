const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/summary', async (_req, res, next) => {
  try {
    const [items, lowStock, pendingPOs, csaMembers, categories] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM inventory_items`),
      pool.query(
        `SELECT COUNT(*) FROM inventory_items i
         JOIN stock_levels s ON s.inventory_item_id = i.id
         WHERE i.is_active = true
           AND (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= s.reorder_point`
      ),
      pool.query(`SELECT COUNT(*) FROM purchase_orders WHERE status IN ('draft', 'submitted', 'shipped')`),
      pool.query(`SELECT COUNT(*) FROM csa_members WHERE subscription_status = 'active'`),
      pool.query(`SELECT COUNT(*) FROM categories`),
    ]);

    res.json({
      total_items: parseInt(items.rows[0].total),
      active_items: parseInt(items.rows[0].active),
      low_stock_count: parseInt(lowStock.rows[0].count),
      pending_purchase_orders: parseInt(pendingPOs.rows[0].count),
      active_csa_members: parseInt(csaMembers.rows[0].count),
      total_categories: parseInt(categories.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/low-stock', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.item_name, i.brand, i.size, c.name as category_name,
        s.qty_on_shelf, s.qty_in_back, s.qty_in_transit, s.reorder_point,
        (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available
       FROM inventory_items i
       JOIN stock_levels s ON s.inventory_item_id = i.id
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.is_active = true
         AND (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= s.reorder_point
       ORDER BY (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) ASC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/recent-movements', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT sm.*, i.item_name, i.brand, u.name as user_name
       FROM stock_movements sm
       JOIN inventory_items i ON i.id = sm.inventory_item_id
       LEFT JOIN users u ON u.id = sm.created_by
       ORDER BY sm.created_at DESC LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
