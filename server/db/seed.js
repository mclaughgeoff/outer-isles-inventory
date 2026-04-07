const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed default admin user
    const hash = await bcrypt.hash('outerisles2024', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['Admin', 'admin@outerisles.com', hash, 'owner']
    );
    console.log('✓ Default admin user created');

    // Load inventory seed data
    const inventoryData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../seed-data/inventory_seed_data.json'), 'utf8')
    );

    // Extract unique categories in order
    const categoryNames = [];
    for (const item of inventoryData) {
      if (!categoryNames.includes(item.category)) {
        categoryNames.push(item.category);
      }
    }

    // Insert categories
    const categoryMap = {};
    for (let i = 0; i < categoryNames.length; i++) {
      const res = await client.query(
        `INSERT INTO categories (name, display_order)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [categoryNames[i], i + 1]
      );
      if (res.rows.length > 0) {
        categoryMap[categoryNames[i]] = res.rows[0].id;
      } else {
        const existing = await client.query('SELECT id FROM categories WHERE name = $1', [categoryNames[i]]);
        categoryMap[categoryNames[i]] = existing.rows[0].id;
      }
    }
    console.log(`✓ ${categoryNames.length} categories seeded`);

    // Extract unique vendors
    const vendorNames = new Set();
    for (const item of inventoryData) {
      if (item.distributor) vendorNames.add(item.distributor);
    }
    const vendorMap = {};
    for (const name of vendorNames) {
      const res = await client.query(
        `INSERT INTO vendors (name)
         VALUES ($1)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [name]
      );
      if (res.rows.length > 0) {
        vendorMap[name] = res.rows[0].id;
      }
    }
    console.log(`✓ ${vendorNames.size} vendors seeded`);

    // Insert inventory items + stock levels
    let itemCount = 0;
    for (const item of inventoryData) {
      const res = await client.query(
        `INSERT INTO inventory_items (
          category_id, item_name, format, brand, sub_sku, size,
          moq, distributor, delivery_minimum, shipping_cost,
          wholesale_cost, retail_price
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING id`,
        [
          categoryMap[item.category],
          item.item_name,
          item.format || null,
          item.brand || null,
          item.sub_sku || null,
          item.size || null,
          item.moq || null,
          item.distributor || null,
          item.delivery_minimum || null,
          item.shipping_cost || null,
          item.wholesale_cost || null,
          item.retail_price || null,
        ]
      );

      // Create stock level row with random initial stock for demo
      const onShelf = Math.floor(Math.random() * 8) + 1;
      const inBack = Math.floor(Math.random() * 12);
      await client.query(
        `INSERT INTO stock_levels (inventory_item_id, qty_on_shelf, qty_in_back, reorder_point)
         VALUES ($1, $2, $3, $4)`,
        [res.rows[0].id, onShelf, inBack, item.moq || 2]
      );
      itemCount++;
    }
    console.log(`✓ ${itemCount} inventory items seeded with stock levels`);

    // Load menu seed data
    const menuData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../seed-data/menu_seed_data.json'), 'utf8')
    );

    let menuCount = 0;
    for (const item of menuData) {
      if (item.name === 'LIST MENU ITEMS HERE') continue;
      await client.query(
        `INSERT INTO menu_items (name, category, price)
         VALUES ($1, $2, $3)`,
        [item.name, item.category || null, item.price || null]
      );
      menuCount++;
    }
    console.log(`✓ ${menuCount} menu items seeded`);

    await client.query('COMMIT');
    console.log('\nSeed complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
