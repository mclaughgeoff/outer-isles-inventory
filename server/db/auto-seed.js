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
        const onShelf = Math.floor(Math.random() * 8) + 1;
        const inBack = Math.floor(Math.random() * 12);
        await client.query(
          'INSERT INTO stock_levels (inventory_item_id, qty_on_shelf, qty_in_back, reorder_point) VALUES ($1,$2,$3,$4)',
          [res.rows[0].id, onShelf, inBack, item.moq || 2]
        );
        itemCount++;
      }
      console.log(`  ✓ ${itemCount} inventory items seeded with stock levels`);

      // Load menu seed data
      const menuPath = path.join(__dirname, '../../seed-data/menu_seed_data.json');
      if (fs.existsSync(menuPath)) {
        const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
        let menuCount = 0;
        for (const item of menuData) {
          if (item.name === 'LIST MENU ITEMS HERE') continue;
          await client.query(
            'INSERT INTO menu_items (name, category, price) VALUES ($1,$2,$3)',
            [item.name, item.category || null, item.price || null]
          );
          menuCount++;
        }
        console.log(`  ✓ ${menuCount} menu items seeded`);
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
