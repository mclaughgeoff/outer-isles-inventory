const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, brand, distributor, search, has_stock, stock_filter, page = 1, limit = 50 } = req.query;
    const conditions = ['i.is_active = true'];
    const params = [];
    let idx = 1;

    if (category) {
      conditions.push(`c.name = $${idx++}`);
      params.push(category);
    }
    if (brand) {
      conditions.push(`i.brand ILIKE $${idx++}`);
      params.push(`%${brand}%`);
    }
    if (distributor) {
      conditions.push(`i.distributor = $${idx++}`);
      params.push(distributor);
    }
    if (search) {
      conditions.push(`(i.item_name ILIKE $${idx} OR i.brand ILIKE $${idx} OR i.sub_sku ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (has_stock === 'true') {
      conditions.push('(s.qty_on_shelf + s.qty_in_back) > 0');
    } else if (has_stock === 'false') {
      conditions.push('(s.qty_on_shelf + s.qty_in_back) = 0');
    }
    if (stock_filter === 'low') {
      conditions.push('(s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= s.reorder_point');
      conditions.push('(s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) > 0');
    } else if (stock_filter === 'out') {
      conditions.push('(s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= 0');
    } else if (stock_filter === 'in') {
      conditions.push('(s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) > s.reorder_point');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM inventory_items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN stock_levels s ON s.inventory_item_id = i.id
       ${where}`,
      params
    );

    const result = await pool.query(
      `SELECT i.*,
        c.name as category_name,
        s.qty_on_shelf, s.qty_in_back, s.qty_in_transit, s.qty_reserved_csa, s.reorder_point,
        (s.qty_on_shelf + s.qty_in_back + s.qty_in_transit) as qty_total,
        (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available,
        CASE WHEN i.retail_price > 0 AND i.wholesale_cost > 0
          THEN ROUND(((i.retail_price - i.wholesale_cost) / i.retail_price) * 100, 1)
          ELSE NULL END as margin_pct
       FROM inventory_items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN stock_levels s ON s.inventory_item_id = i.id
       ${where}
       ORDER BY c.display_order, i.item_name
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as category_name,
        s.qty_on_shelf, s.qty_in_back, s.qty_in_transit, s.qty_reserved_csa, s.reorder_point,
        (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available
       FROM inventory_items i
       JOIN stock_levels s ON s.inventory_item_id = i.id
       LEFT JOIN categories c ON c.id = i.category_id
       WHERE i.is_active = true
         AND (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) <= s.reorder_point
       ORDER BY (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) ASC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as category_name,
        s.qty_on_shelf, s.qty_in_back, s.qty_in_transit, s.qty_reserved_csa, s.reorder_point,
        (s.qty_on_shelf + s.qty_in_back + s.qty_in_transit) as qty_total,
        (s.qty_on_shelf + s.qty_in_back - s.qty_reserved_csa) as qty_available,
        CASE WHEN i.retail_price > 0 AND i.wholesale_cost > 0
          THEN ROUND(((i.retail_price - i.wholesale_cost) / i.retail_price) * 100, 1)
          ELSE NULL END as margin_pct
       FROM inventory_items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN stock_levels s ON s.inventory_item_id = i.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

    const movements = await pool.query(
      `SELECT sm.*, u.name as user_name
       FROM stock_movements sm
       LEFT JOIN users u ON u.id = sm.created_by
       WHERE sm.inventory_item_id = $1
       ORDER BY sm.created_at DESC LIMIT 20`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], movements: movements.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      category_id, item_name, format, brand, sub_sku, size,
      moq, distributor, delivery_minimum, shipping_cost,
      wholesale_cost, retail_price, tax_category, notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO inventory_items (
        category_id, item_name, format, brand, sub_sku, size,
        moq, distributor, delivery_minimum, shipping_cost,
        wholesale_cost, retail_price, tax_category, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [category_id, item_name, format, brand, sub_sku, size,
       moq, distributor, delivery_minimum, shipping_cost,
       wholesale_cost, retail_price, tax_category || 'standard', notes]
    );

    await pool.query(
      'INSERT INTO stock_levels (inventory_item_id, reorder_point) VALUES ($1, $2)',
      [result.rows[0].id, moq || 2]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const fields = [
      'category_id', 'item_name', 'format', 'brand', 'sub_sku', 'size',
      'moq', 'distributor', 'delivery_minimum', 'shipping_cost',
      'wholesale_cost', 'retail_price', 'tax_category', 'notes', 'image_url'
    ];
    const sets = [];
    const params = [];
    let idx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = $${idx++}`);
        params.push(req.body[field]);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    sets.push('updated_at = NOW()');
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE inventory_items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      'UPDATE inventory_items SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deactivated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
