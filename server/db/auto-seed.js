// Auto-seed: checks if database is empty and seeds it automatically
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function autoSeed(pool) {
  try {
    // Check if categories table has data
    const check = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(check.rows[0].count) > 0) {
      console.log('  Database already has data — skipping auto-seed');
      return;
    }

    console.log('  Database is empty — running auto-seed...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Seed default admin user
      const hash = await bcrypt.hash('outerisles2024', 10);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
        ['Admin', 'admin@outerisles.com', hash, 'owner']
      );
      console.log('  ✓ Admin user created');

      // Load inventory seed data
      const seedDataPath = path.join(__dirname, '../../seed-data/inventory_seed_data.json');
      if (!fs.existsSync(seedDataPath)) {
        console.log('  ✗ Seed data file not found at:', seedDataPath);
        await client.query('ROLLBACK');
        return;
      }

      const inventoryData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

      // Extract unique categories
      const categoryNames = [];
      for (const item of inventoryData) {
        if (!categoryNames.includes(item.category)) categoryNames.push(item.category);
      }

      // Insert categories
      const categoryMap = {};
      for (let i = 0; i < categoryNames.length; i++) {
        const res = await client.query(
          'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING id',
          [categoryNames[i], i + 1]
        );
        categoryMap[categoryNames[i]] = res.rows[0].id;
      }
      console.log(`  ✓ ${categoryNames.length} categories seeded`);

      // Insert inventory items + stock levels
      let itemCount = 0;
      for (const item of inventoryData) {
        const res = await client.query(
          `INSERT INTO inventory_items (
            category_id, item_name, format, brand, sub_sku, size,
            moq, distributor, delivery_minimum, shipping_cost,
            wholesale_cost, retail_price
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [
            categoryMap[item.category], item.item_name, item.format || null,
            item.brand || null, item.sub_sku || null, item.size || null,
            item.moq || null, item.distributor || null,
            item.delivery_minimum || null, item.shipping_cost || null,
            item.wholesale_cost || null, item.retail_price || null,
          ]
        );
        // Vary stock levels: ~30% surplus, ~40% normal, ~20% low, ~10% out
        const rng = Math.random();
        let onShelf, inBack, inTransit = 0;
        const reorderPt = item.moq || 2;
        if (rng < 0.10) {
          // Out of stock
          onShelf = 0;
          inBack = 0;
          inTransit = Math.random() < 0.5 ? Math.floor(Math.random() * 6) + 1 : 0;
        } else if (rng < 0.30) {
          // Low stock (at or below reorder point)
          onShelf = Math.floor(Math.random() * Math.max(reorderPt, 2));
          inBack = Math.floor(Math.random() * 2);
          inTransit = Math.random() < 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
        } else if (rng < 0.70) {
          // Normal stock
          onShelf = Math.floor(Math.random() * 6) + 2;
          inBack = Math.floor(Math.random() * 8) + 1;
        } else {
          // Surplus stock (well above reorder point)
          onShelf = Math.floor(Math.random() * 10) + 6;
          inBack = Math.floor(Math.random() * 15) + 5;
        }
        await client.query(
          'INSERT INTO stock_levels (inventory_item_id, qty_on_shelf, qty_in_back, qty_in_transit, reorder_point) VALUES ($1,$2,$3,$4,$5)',
          [res.rows[0].id, onShelf, inBack, inTransit, reorderPt]
        );
        itemCount++;
      }
      console.log(`  ✓ ${itemCount} inventory items seeded with stock levels`);

      // Build lookup of inventory item names to IDs
      const invLookup = {};
      const allInvItems = await client.query('SELECT id, item_name FROM inventory_items');
      for (const row of allInvItems.rows) {
        // Store first match for each name (some items have duplicate names)
        if (!invLookup[row.item_name]) {
          invLookup[row.item_name] = row.id;
        }
      }

      // Load menu seed data
      const menuPath = path.join(__dirname, '../../seed-data/menu_seed_data.json');
      if (fs.existsSync(menuPath)) {
        const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
        let menuCount = 0;
        let ingredientCount = 0;
        for (const item of menuData) {
          if (item.name === 'LIST MENU ITEMS HERE') continue;
          const menuRes = await client.query(
            'INSERT INTO menu_items (name, category, price) VALUES ($1,$2,$3) RETURNING id',
            [item.name, item.category || null, item.price || null]
          );
          menuCount++;

          // Seed ingredients if present
          if (item.ingredients?.length > 0) {
            for (const ing of item.ingredients) {
              const invId = invLookup[ing.item_name];
              if (invId) {
                await client.query(
                  'INSERT INTO menu_item_ingredients (menu_item_id, inventory_item_id, quantity_used, unit) VALUES ($1,$2,$3,$4)',
                  [menuRes.rows[0].id, invId, ing.quantity_used, ing.unit]
                );
                ingredientCount++;
              }
            }
          }
        }
        console.log(`  ✓ ${menuCount} menu items seeded with ${ingredientCount} ingredient links`);
      }

      await client.query('COMMIT');
      console.log('  Auto-seed complete!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('  Auto-seed failed, rolling back:', err.message);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('  Auto-seed check failed:', err.message);
  }
}

module.exports = autoSeed;
