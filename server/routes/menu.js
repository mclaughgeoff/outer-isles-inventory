const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT m.*,
        COALESCE(json_agg(
          json_build_object('id', mi.id, 'inventory_item_id', mi.inventory_item_id, 'quantity_used', mi.quantity_used, 'unit', mi.unit, 'item_name', i.item_name)
        ) FILTER (WHERE mi.id IS NOT NULL), '[]') as ingredients
       FROM menu_items m
       LEFT JOIN menu_item_ingredients mi ON mi.menu_item_id = m.id
       LEFT JOIN inventory_items i ON i.id = mi.inventory_item_id
       WHERE m.is_active = true
       GROUP BY m.id
       ORDER BY m.category, m.name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM menu_items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });

    const ingredients = await pool.query(
      `SELECT mi.*, i.item_name, i.brand, i.wholesale_cost
       FROM menu_item_ingredients mi
       JOIN inventory_items i ON i.id = mi.inventory_item_id
       WHERE mi.menu_item_id = $1`,
      [req.params.id]
    );

    res.json({ ...result.rows[0], ingredients: ingredients.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, description, kitchen_name, category, price, tax_category, ingredients } = req.body;
    const result = await pool.query(
      `INSERT INTO menu_items (name, description, kitchen_name, category, price, tax_category)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, description, kitchen_name, category, price, tax_category || 'meal_tax']
    );
    const menuItem = result.rows[0];

    if (ingredients?.length > 0) {
      for (const ing of ingredients) {
        await pool.query(
          `INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity_used, unit, notes)
           VALUES ($1,$2,$3,$4,$5)`,
          [menuItem.id, ing.inventory_item_id, ing.quantity_used, ing.unit, ing.notes]
        );
      }
    }

    res.status(201).json(menuItem);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, description, kitchen_name, category, price, tax_category, is_active } = req.body;
    const result = await pool.query(
      `UPDATE menu_items SET
        name = COALESCE($1, name), description = COALESCE($2, description),
        kitchen_name = COALESCE($3, kitchen_name), category = COALESCE($4, category),
        price = COALESCE($5, price), tax_category = COALESCE($6, tax_category),
        is_active = COALESCE($7, is_active), updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [name, description, kitchen_name, category, price, tax_category, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Menu item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
