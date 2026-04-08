require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// ====================================================================
// SETUP: Try PostgreSQL, fall back to mock mode if anything goes wrong
// ====================================================================
async function setupRoutes() {
  let usingDatabase = false;

  if (process.env.DATABASE_URL) {
    try {
      console.log('DATABASE_URL found — testing PostgreSQL connection...');
      const pool = require('./db/pool');

      // Test the connection
      await pool.query('SELECT 1');
      console.log('  PostgreSQL connection successful');

      // Auto-seed if empty
      const autoSeed = require('./db/auto-seed');
      await autoSeed(pool);

      // Verify data exists
      const check = await pool.query('SELECT COUNT(*) FROM inventory_items');
      if (parseInt(check.rows[0].count) > 0) {
        console.log(`  Database has ${check.rows[0].count} inventory items — using PostgreSQL mode`);
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/categories', require('./routes/categories'));
        app.use('/api/inventory', require('./routes/inventory'));
        app.use('/api/stock', require('./routes/stock'));
        app.use('/api/dashboard', require('./routes/dashboard'));
        app.use('/api/menu', require('./routes/menu'));
        app.use('/api/vendors', require('./routes/vendors'));
        app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
        usingDatabase = true;
      } else {
        console.log('  Database is empty after seed attempt — falling back to mock mode');
      }
    } catch (err) {
      console.error('  PostgreSQL setup failed:', err.message);
      console.log('  Falling back to mock mode');
    }
  }

  if (!usingDatabase) {
    console.log('Starting in mock mode (in-memory seed data)');
    setupMockRoutes();
  }

  // ---------- Serve React frontend ----------
  const clientDist = path.join(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    console.log('Serving frontend from', clientDist);
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  } else {
    console.log('No client/dist found — frontend not available');
    app.get('/', (_req, res) => res.json({ status: 'API only', message: 'Build the frontend with: cd client && npm run build' }));
  }

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nOuter Isles server running on port ${PORT} (${usingDatabase ? 'PostgreSQL' : 'mock'} mode)\n`);
  });
}

// ====================================================================
// MOCK MODE: Full in-memory API from seed data
// ====================================================================
function setupMockRoutes() {
  // Try multiple possible paths for seed data (differs between dev and Replit deployment)
  const possiblePaths = [
    path.join(__dirname, '../seed-data'),
    path.join(process.cwd(), 'seed-data'),
    path.join(__dirname, '..', 'seed-data'),
  ];
  let seedDir = possiblePaths.find(p => fs.existsSync(path.join(p, 'inventory_seed_data.json')));
  if (!seedDir) {
    console.error('  Seed data not found! Tried:', possiblePaths);
    console.error('  CWD:', process.cwd(), '__dirname:', __dirname);
    // Create empty fallback data
    seedDir = null;
  }

  const inventoryRaw = seedDir
    ? JSON.parse(fs.readFileSync(path.join(seedDir, 'inventory_seed_data.json'), 'utf8'))
    : [{ category: 'General', item_name: 'Sample Item', format: 'CPG', brand: 'Sample', sub_sku: 'Sample item', size: '1 EA', moq: 1, distributor: null, delivery_minimum: null, shipping_cost: null, wholesale_cost: 5.00, retail_price: 10.00 }];
  const menuRaw = seedDir && fs.existsSync(path.join(seedDir, 'menu_seed_data.json'))
    ? JSON.parse(fs.readFileSync(path.join(seedDir, 'menu_seed_data.json'), 'utf8')).filter(m => m.name !== 'LIST MENU ITEMS HERE')
    : [];

  // Build categories
  const categoryNames = [];
  for (const item of inventoryRaw) { if (!categoryNames.includes(item.category)) categoryNames.push(item.category); }
  const categories = categoryNames.map((name, i) => ({ id: i + 1, name, display_order: i + 1 }));
  const categoryMap = {};
  categories.forEach(c => { categoryMap[c.name] = c.id; });

  // Build inventory items with mock stock
  const items = inventoryRaw.map((item, i) => {
    const id = i + 1;
    const onShelf = Math.floor(Math.random() * 8) + 1;
    const inBack = Math.floor(Math.random() * 12);
    const inTransit = Math.random() > 0.8 ? Math.floor(Math.random() * 6) : 0;
    return {
      id, category_id: categoryMap[item.category], category_name: item.category,
      item_name: item.item_name, format: item.format, brand: item.brand,
      sub_sku: item.sub_sku, size: item.size, moq: item.moq,
      distributor: item.distributor, delivery_minimum: item.delivery_minimum,
      shipping_cost: item.shipping_cost, wholesale_cost: item.wholesale_cost,
      retail_price: item.retail_price, is_active: true,
      qty_on_shelf: onShelf, qty_in_back: inBack, qty_in_transit: inTransit,
      qty_reserved_csa: 0, reorder_point: item.moq || 2,
      qty_total: onShelf + inBack + inTransit, qty_available: onShelf + inBack,
      margin_pct: item.retail_price && item.wholesale_cost
        ? Math.round(((item.retail_price - item.wholesale_cost) / item.retail_price) * 1000) / 10 : null,
      movements: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
  });

  const menuItems = menuRaw.map((m, i) => ({
    id: i + 1, name: m.name, category: m.category, vendor: m.vendor || null,
    price: m.price, is_active: true, ingredients: [], created_at: new Date().toISOString(),
  }));

  const vendorNames = [...new Set(inventoryRaw.map(i => i.distributor).filter(Boolean))];
  const vendors = vendorNames.map((name, i) => ({ id: i + 1, name, item_count: items.filter(it => it.distributor === name).length }));

  let itemNextId = items.length + 1;
  let menuNextId = menuItems.length + 1;
  let csaMembers = [], csaMemberNextId = 1;
  let csaBoxes = [], csaBoxNextId = 1;
  let csaBoxItems = [], csaBoxItemNextId = 1;

  const mockUser = { id: 1, name: 'Admin', email: 'admin@outerisles.com', role: 'owner' };

  // --- Auth ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@outerisles.com' && password === 'outerisles2024') {
      const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ user: mockUser, token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });
  app.post('/api/auth/logout', (_req, res) => { res.clearCookie('token'); res.json({ message: 'Logged out' }); });
  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try { const d = jwt.verify(token, JWT_SECRET); res.json({ id: d.id, name: d.name, email: d.email, role: d.role }); }
    catch { res.status(401).json({ error: 'Invalid token' }); }
  });

  // --- Dashboard ---
  app.get('/api/dashboard/summary', (_req, res) => {
    res.json({
      total_items: items.length, active_items: items.length,
      low_stock_count: items.filter(i => i.qty_available <= i.reorder_point).length,
      pending_purchase_orders: 0,
      active_csa_members: csaMembers.filter(m => m.subscription_status === 'active').length,
      total_categories: categories.length,
    });
  });
  app.get('/api/dashboard/low-stock', (_req, res) => {
    res.json(items.filter(i => i.qty_available <= i.reorder_point).sort((a, b) => a.qty_available - b.qty_available).slice(0, 20));
  });
  app.get('/api/dashboard/recent-movements', (_req, res) => res.json([]));

  // --- Categories ---
  app.get('/api/categories', (_req, res) => {
    res.json(categories.map(c => ({ ...c, item_count: items.filter(i => i.category_id === c.id).length })));
  });

  // --- Inventory ---
  app.get('/api/inventory', (req, res) => {
    const { search, category, distributor, has_stock, page = 1, limit = 50 } = req.query;
    let filtered = [...items];
    if (search) { const s = search.toLowerCase(); filtered = filtered.filter(i => i.item_name.toLowerCase().includes(s) || (i.brand && i.brand.toLowerCase().includes(s)) || (i.sub_sku && i.sub_sku.toLowerCase().includes(s))); }
    if (category) filtered = filtered.filter(i => i.category_name === category);
    if (distributor) filtered = filtered.filter(i => i.distributor === distributor);
    if (has_stock === 'true') filtered = filtered.filter(i => i.qty_available > 0);
    if (has_stock === 'false') filtered = filtered.filter(i => i.qty_available <= 0);
    const total = filtered.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    res.json({ items: filtered.slice(offset, offset + parseInt(limit)), total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  });
  app.get('/api/inventory/alerts', (_req, res) => res.json(items.filter(i => i.qty_available <= i.reorder_point)));
  app.get('/api/inventory/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  app.post('/api/inventory', (req, res) => {
    const newItem = {
      id: itemNextId++, category_id: req.body.category_id || null,
      category_name: categories.find(c => c.id === parseInt(req.body.category_id))?.name || null,
      item_name: req.body.item_name, format: req.body.format || null, brand: req.body.brand || null,
      sub_sku: req.body.sub_sku || null, size: req.body.size || null, moq: req.body.moq || null,
      distributor: req.body.distributor || null, delivery_minimum: req.body.delivery_minimum || null,
      shipping_cost: req.body.shipping_cost || null, wholesale_cost: req.body.wholesale_cost || null,
      retail_price: req.body.retail_price || null, is_active: true,
      qty_on_shelf: 0, qty_in_back: 0, qty_in_transit: 0, qty_reserved_csa: 0,
      reorder_point: req.body.moq || 2, qty_total: 0, qty_available: 0, margin_pct: null,
      movements: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    items.push(newItem);
    res.status(201).json(newItem);
  });

  // --- Stock ---
  app.post('/api/stock/:itemId/move', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.itemId));
    if (!item) return res.status(404).json({ error: 'Not found' });
    const { from_location, to_location, quantity } = req.body;
    const colMap = { shelf: 'qty_on_shelf', back: 'qty_in_back', transit: 'qty_in_transit' };
    if (item[colMap[from_location]] < quantity) return res.status(400).json({ error: 'Not enough stock' });
    item[colMap[from_location]] -= quantity;
    item[colMap[to_location]] += quantity;
    item.qty_total = item.qty_on_shelf + item.qty_in_back + item.qty_in_transit;
    item.qty_available = item.qty_on_shelf + item.qty_in_back - item.qty_reserved_csa;
    res.json(item);
  });
  app.post('/api/stock/:itemId/receive', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.itemId));
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.qty_in_back += req.body.quantity;
    item.qty_in_transit = Math.max(0, item.qty_in_transit - req.body.quantity);
    item.qty_total = item.qty_on_shelf + item.qty_in_back + item.qty_in_transit;
    item.qty_available = item.qty_on_shelf + item.qty_in_back - item.qty_reserved_csa;
    res.json(item);
  });
  app.get('/api/stock/movements', (_req, res) => res.json([]));

  // --- Menu ---
  app.get('/api/menu', (_req, res) => res.json(menuItems));
  app.get('/api/menu/:id', (req, res) => {
    const item = menuItems.find(m => m.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });
  app.post('/api/menu', (req, res) => {
    const newItem = {
      id: menuNextId++, name: req.body.name, description: req.body.description || null,
      kitchen_name: req.body.kitchen_name || null, category: req.body.category || null,
      vendor: req.body.vendor || null, price: req.body.price || null,
      tax_category: req.body.tax_category || 'meal_tax', is_active: true,
      ingredients: (req.body.ingredients || []).map((ing, i) => ({
        id: i + 1, inventory_item_id: ing.inventory_item_id, quantity_used: ing.quantity_used,
        unit: ing.unit, item_name: items.find(it => it.id === ing.inventory_item_id)?.item_name || 'Unknown',
      })),
      created_at: new Date().toISOString(),
    };
    menuItems.push(newItem);
    res.status(201).json(newItem);
  });
  app.put('/api/menu/:id', (req, res) => {
    const item = menuItems.find(m => m.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ error: 'Not found' });
    ['name', 'description', 'kitchen_name', 'category', 'price', 'tax_category', 'vendor'].forEach(k => {
      if (req.body[k] !== undefined) item[k] = req.body[k];
    });
    if (req.body.ingredients !== undefined) {
      item.ingredients = req.body.ingredients.map((ing, i) => ({
        id: i + 1, inventory_item_id: ing.inventory_item_id, quantity_used: ing.quantity_used,
        unit: ing.unit, item_name: items.find(it => it.id === ing.inventory_item_id)?.item_name || 'Unknown',
      }));
    }
    item.updated_at = new Date().toISOString();
    res.json(item);
  });

  // --- Vendors ---
  app.get('/api/vendors', (_req, res) => res.json(vendors));

  // --- Purchase Orders ---
  app.get('/api/purchase-orders', (_req, res) => res.json([]));

  // --- CSA ---
  app.get('/api/csa/members', (_req, res) => res.json(csaMembers));
  app.post('/api/csa/members', (req, res) => { const m = { id: csaMemberNextId++, ...req.body, created_at: new Date().toISOString() }; csaMembers.push(m); res.status(201).json(m); });
  app.put('/api/csa/members/:id', (req, res) => { const m = csaMembers.find(x => x.id === parseInt(req.params.id)); if (!m) return res.status(404).json({ error: 'Not found' }); Object.assign(m, req.body); res.json(m); });
  app.get('/api/csa/boxes', (_req, res) => res.json(csaBoxes.map(b => ({ ...b, item_count: csaBoxItems.filter(i => i.csa_box_id === b.id).length }))));
  app.post('/api/csa/boxes', (req, res) => { const b = { id: csaBoxNextId++, ...req.body, created_at: new Date().toISOString() }; csaBoxes.push(b); res.status(201).json(b); });
  app.put('/api/csa/boxes/:id', (req, res) => { const b = csaBoxes.find(x => x.id === parseInt(req.params.id)); if (!b) return res.status(404).json({ error: 'Not found' }); Object.assign(b, req.body); res.json(b); });
  app.get('/api/csa/boxes/:id', (req, res) => {
    const box = csaBoxes.find(b => b.id === parseInt(req.params.id));
    if (!box) return res.status(404).json({ error: 'Not found' });
    const boxItemsList = csaBoxItems.filter(bi => bi.csa_box_id === box.id).map(bi => {
      const inv = items.find(i => i.id === bi.inventory_item_id);
      return { id: bi.id, inventory_item_id: bi.inventory_item_id, quantity: bi.quantity, item_name: inv?.item_name || 'Unknown', brand: inv?.brand || '', size: inv?.size || '', qty_available: inv?.qty_available || 0 };
    });
    res.json({ ...box, items: boxItemsList, active_member_count: csaMembers.filter(m => m.subscription_status === 'active').length });
  });
  app.post('/api/csa/boxes/:id/items', (req, res) => {
    const boxId = parseInt(req.params.id);
    if (!csaBoxes.find(b => b.id === boxId)) return res.status(404).json({ error: 'Box not found' });
    const bi = { id: csaBoxItemNextId++, csa_box_id: boxId, inventory_item_id: req.body.inventory_item_id, quantity: req.body.quantity || 1 };
    csaBoxItems.push(bi);
    res.status(201).json(bi);
  });
  app.delete('/api/csa/boxes/:boxId/items/:itemId', (req, res) => {
    csaBoxItems = csaBoxItems.filter(bi => bi.id !== parseInt(req.params.itemId));
    res.json({ message: 'Removed' });
  });

  console.log(`  Mock API ready — ${items.length} inventory items, ${menuItems.length} menu items`);
}

// ====================================================================
// START
// ====================================================================
setupRoutes().catch(err => {
  console.error('Fatal startup error:', err);
  // Even if setup fails, try to start with mock mode
  setupMockRoutes();
  const clientDist = path.join(__dirname, '../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Outer Isles server running on port ${PORT} (mock fallback after error)`);
  });
});
