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

router.get('/stock-overview', async (_req, res, next) => {
  try {
    const [totals, byCategory, byLocation, inTransit, recentReceived] = await Promise.all([
      // Aggregate totals
      pool.query(
        `SELECT
           COALESCE(SUM(s.qty_on_shelf), 0)::int as total_on_shelf,
           COALESCE(SUM(s.qty_in_back), 0)::int as total_in_back,
           COALESCE(SUM(s.qty_in_transit), 0)::int as total_in_transit,
           COALESCE(SUM(s.qty_reserved_csa), 0)::int as total_reserved_csa,
           COALESCE(SUM(s.qty_on_shelf + s.qty_in_back), 0)::int as total_on_hand,
           COALESCE(SUM(s.qty_on_shelf + s.qty_in_back + s.qty_in_transit), 0)::int as grand_total,
           COUNT(*) FILTER (WHERE (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) > s.reorder_point)::int as in_stock_count,
           COUNT(*) FILTER (WHERE (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= s.reorder_point AND (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) > 0)::int as low_stock_count,
           COUNT(*) FILTER (WHERE (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= 0)::int as out_of_stock_count,
           COALESCE(SUM(i.wholesale_cost * (s.qty_on_shelf + s.qty_in_back)), 0) as total_inventory_value
         FROM inventory_items i
         JOIN stock_levels s ON s.inventory_item_id = i.id
         WHERE i.is_active = true`
      ),
      // By category
      pool.query(
        `SELECT c.name as category,
           COALESCE(SUM(s.qty_on_shelf), 0)::int as on_shelf,
           COALESCE(SUM(s.qty_in_back), 0)::int as in_back,
           COALESCE(SUM(s.qty_in_transit), 0)::int as in_transit,
           COUNT(*)::int as item_count
         FROM inventory_items i
         JOIN stock_levels s ON s.inventory_item_id = i.id
         LEFT JOIN categories c ON c.id = i.category_id
         WHERE i.is_active = true
         GROUP BY c.name, c.display_order
         ORDER BY c.display_order`
      ),
      // Top items by shelf quantity
      pool.query(
        `SELECT i.id, i.item_name, i.brand, c.name as category_name,
           s.qty_on_shelf, s.qty_in_back, s.qty_in_transit, s.qty_reserved_csa, s.reorder_point,
           (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available,
           (s.qty_on_shelf + s.qty_in_back + s.qty_in_transit) as qty_total
         FROM inventory_items i
         JOIN stock_levels s ON s.inventory_item_id = i.id
         LEFT JOIN categories c ON c.id = i.category_id
         WHERE i.is_active = true
         ORDER BY (s.qty_on_shelf + s.qty_in_back) DESC
         LIMIT 50`
      ),
      // Items in transit
      pool.query(
        `SELECT i.id, i.item_name, i.brand, c.name as category_name,
           s.qty_in_transit, s.qty_on_shelf, s.qty_in_back, s.reorder_point,
           (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available
         FROM inventory_items i
         JOIN stock_levels s ON s.inventory_item_id = i.id
         LEFT JOIN categories c ON c.id = i.category_id
         WHERE i.is_active = true AND s.qty_in_transit > 0
         ORDER BY s.qty_in_transit DESC`
      ),
      // Recently received (last 14 days)
      pool.query(
        `SELECT sm.id, sm.quantity, sm.to_location, sm.notes, sm.created_at,
           i.item_name, i.brand
         FROM stock_movements sm
         JOIN inventory_items i ON i.id = sm.inventory_item_id
         WHERE sm.movement_type = 'receive'
           AND sm.created_at >= NOW() - INTERVAL '14 days'
         ORDER BY sm.created_at DESC
         LIMIT 15`
      ),
    ]);

    res.json({
      totals: totals.rows[0],
      byCategory: byCategory.rows,
      allItems: inTransit.rows.length > 0 ? byLocation.rows : byLocation.rows, // always send top items
      inTransit: inTransit.rows,
      recentReceived: recentReceived.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
