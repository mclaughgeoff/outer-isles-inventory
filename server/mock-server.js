// Lightweight mock server — runs without PostgreSQL for local preview
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Load seed data
const inventoryData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed-data/inventory_seed_data.json'), 'utf8'));
const menuData = JSON.parse(fs.readFileSync(path.join(__dirname, '../seed-data/menu_seed_data.json'), 'utf8')).filter(m => m.name !== 'LIST MENU ITEMS HERE');

// Build categories
const categoryNames = [];
for (const item of inventoryData) {
  if (!categoryNames.includes(item.category)) categoryNames.push(item.category);
}
const categories = categoryNames.map((name, i) => ({ id: i + 1, name, display_order: i + 1 }));
const categoryMap = {};
categories.forEach(c => { categoryMap[c.name] = c.id; });

// Build inventory items with mock stock
const items = inventoryData.map((item, i) => {
  const id = i + 1;
  const onShelf = Math.floor(Math.random() * 8) + 1;
  const inBack = Math.floor(Math.random() * 12);
  const inTransit = Math.random() > 0.8 ? Math.floor(Math.random() * 6) : 0;
  const reorderPoint = item.moq || 2;
  return {
    id,
    category_id: categoryMap[item.category],
    category_name: item.category,
    item_name: item.item_name,
    format: item.format,
    brand: item.brand,
    sub_sku: item.sub_sku,
    size: item.size,
    moq: item.moq,
    distributor: item.distributor,
    delivery_minimum: item.delivery_minimum,
    shipping_cost: item.shipping_cost,
    wholesale_cost: item.wholesale_cost,
    retail_price: item.retail_price,
    is_active: true,
    qty_on_shelf: onShelf,
    qty_in_back: inBack,
    qty_in_transit: inTransit,
    qty_reserved_csa: 0,
    reorder_point: reorderPoint,
    qty_total: onShelf + inBack + inTransit,
    qty_available: onShelf + inBack,
    margin_pct: item.retail_price && item.wholesale_cost
      ? Math.round(((item.retail_price - item.wholesale_cost) / item.retail_price) * 1000) / 10
      : null,
    movements: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

// Menu items
const menuItems = menuData.map((m, i) => ({
  id: i + 1,
  name: m.name,
  category: m.category,
  vendor: m.vendor || null,
  price: m.price,
  is_active: true,
  ingredients: [],
  created_at: new Date().toISOString(),
}));

// Vendors
const vendorNames = [...new Set(inventoryData.map(i => i.distributor).filter(Boolean))];
const vendors = vendorNames.map((name, i) => ({
  id: i + 1,
  name,
  item_count: items.filter(it => it.distributor === name).length,
}));

// Auth
const mockUser = { id: 1, name: 'Admin', email: 'admin@outerisles.com', role: 'owner' };

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@outerisles.com' && password === 'outerisles2024') {
    const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ user: mockUser, token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ id: decoded.id, name: decoded.name, email: decoded.email, role: decoded.role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Dashboard
app.get('/api/dashboard/summary', (_req, res) => {
  const lowStock = items.filter(i => i.qty_available <= i.reorder_point).length;
  res.json({
    total_items: items.length,
    active_items: items.length,
    low_stock_count: lowStock,
    pending_purchase_orders: 0,
    active_csa_members: 0,
    total_categories: categories.length,
  });
});

app.get('/api/dashboard/low-stock', (_req, res) => {
  const lowStock = items
    .filter(i => i.qty_available <= i.reorder_point)
    .sort((a, b) => a.qty_available - b.qty_available)
    .slice(0, 20);
  res.json(lowStock);
});

app.get('/api/dashboard/recent-movements', (_req, res) => {
  res.json([]);
});

// Categories
app.get('/api/categories', (_req, res) => {
  const withCounts = categories.map(c => ({
    ...c,
    item_count: items.filter(i => i.category_id === c.id).length,
  }));
  res.json(withCounts);
});

// Inventory
app.get('/api/inventory', (req, res) => {
  const { search, category, distributor, has_stock, page = 1, limit = 50 } = req.query;
  let filtered = [...items];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(i =>
      i.item_name.toLowerCase().includes(s) ||
      (i.brand && i.brand.toLowerCase().includes(s)) ||
      (i.sub_sku && i.sub_sku.toLowerCase().includes(s))
    );
  }
  if (category) filtered = filtered.filter(i => i.category_name === category);
  if (distributor) filtered = filtered.filter(i => i.distributor === distributor);
  if (has_stock === 'true') filtered = filtered.filter(i => i.qty_available > 0);
  if (has_stock === 'false') filtered = filtered.filter(i => i.qty_available <= 0);

  const total = filtered.length;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const paged = filtered.slice(offset, offset + parseInt(limit));

  res.json({
    items: paged,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

app.get('/api/inventory/alerts', (_req, res) => {
  res.json(items.filter(i => i.qty_available <= i.reorder_point));
});

app.get('/api/inventory/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// Stock
app.post('/api/stock/:itemId/move', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.itemId));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { from_location, to_location, quantity } = req.body;
  const fromCol = { shelf: 'qty_on_shelf', back: 'qty_in_back', transit: 'qty_in_transit' }[from_location];
  const toCol = { shelf: 'qty_on_shelf', back: 'qty_in_back', transit: 'qty_in_transit' }[to_location];
  if (item[fromCol] < quantity) return res.status(400).json({ error: 'Not enough stock' });
  item[fromCol] -= quantity;
  item[toCol] += quantity;
  item.qty_total = item.qty_on_shelf + item.qty_in_back + item.qty_in_transit;
  item.qty_available = item.qty_on_shelf + item.qty_in_back - item.qty_reserved_csa;
  res.json(item);
});

app.post('/api/stock/:itemId/receive', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.itemId));
  if (!item) return res.status(404).json({ error: 'Not found' });
  const { quantity } = req.body;
  item.qty_in_back += quantity;
  item.qty_in_transit = Math.max(0, item.qty_in_transit - quantity);
  item.qty_total = item.qty_on_shelf + item.qty_in_back + item.qty_in_transit;
  item.qty_available = item.qty_on_shelf + item.qty_in_back - item.qty_reserved_csa;
  res.json(item);
});

app.get('/api/stock/movements', (_req, res) => res.json([]));

// Inventory — create new item (for inline ingredient creation)
let itemNextId = items.length + 1;
app.post('/api/inventory', (req, res) => {
  const newItem = {
    id: itemNextId++,
    category_id: req.body.category_id || null,
    category_name: categories.find(c => c.id === parseInt(req.body.category_id))?.name || null,
    item_name: req.body.item_name,
    format: req.body.format || null,
    brand: req.body.brand || null,
    sub_sku: req.body.sub_sku || null,
    size: req.body.size || null,
    moq: req.body.moq || null,
    distributor: req.body.distributor || null,
    delivery_minimum: req.body.delivery_minimum || null,
    shipping_cost: req.body.shipping_cost || null,
    wholesale_cost: req.body.wholesale_cost || null,
    retail_price: req.body.retail_price || null,
    is_active: true,
    qty_on_shelf: 0, qty_in_back: 0, qty_in_transit: 0, qty_reserved_csa: 0,
    reorder_point: req.body.moq || 2,
    qty_total: 0, qty_available: 0, margin_pct: null,
    movements: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  items.push(newItem);
  res.status(201).json(newItem);
});

// Menu
let menuNextId = menuItems.length + 1;

app.get('/api/menu', (_req, res) => res.json(menuItems));

app.get('/api/menu/:id', (req, res) => {
  const item = menuItems.find(m => m.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/menu', (req, res) => {
  const newItem = {
    id: menuNextId++,
    name: req.body.name,
    description: req.body.description || null,
    kitchen_name: req.body.kitchen_name || null,
    category: req.body.category || null,
    vendor: req.body.vendor || null,
    price: req.body.price || null,
    tax_category: req.body.tax_category || 'meal_tax',
    is_active: true,
    ingredients: (req.body.ingredients || []).map((ing, i) => ({
      id: i + 1,
      inventory_item_id: ing.inventory_item_id,
      quantity_used: ing.quantity_used,
      unit: ing.unit,
      item_name: items.find(it => it.id === ing.inventory_item_id)?.item_name || 'Unknown',
    })),
    created_at: new Date().toISOString(),
  };
  menuItems.push(newItem);
  res.status(201).json(newItem);
});

app.put('/api/menu/:id', (req, res) => {
  const item = menuItems.find(m => m.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  if (req.body.name !== undefined) item.name = req.body.name;
  if (req.body.description !== undefined) item.description = req.body.description;
  if (req.body.kitchen_name !== undefined) item.kitchen_name = req.body.kitchen_name;
  if (req.body.category !== undefined) item.category = req.body.category;
  if (req.body.price !== undefined) item.price = req.body.price;
  if (req.body.tax_category !== undefined) item.tax_category = req.body.tax_category;
  if (req.body.vendor !== undefined) item.vendor = req.body.vendor;
  if (req.body.ingredients !== undefined) {
    item.ingredients = req.body.ingredients.map((ing, i) => ({
      id: i + 1,
      inventory_item_id: ing.inventory_item_id,
      quantity_used: ing.quantity_used,
      unit: ing.unit,
      item_name: items.find(it => it.id === ing.inventory_item_id)?.item_name || 'Unknown',
    }));
  }
  item.updated_at = new Date().toISOString();
  res.json(item);
});

// Vendors
app.get('/api/vendors', (_req, res) => res.json(vendors));

// Purchase Orders
app.get('/api/purchase-orders', (_req, res) => res.json([]));

// CSA
let csaMembers = [];
let csaMemberNextId = 1;
let csaBoxes = [];
let csaBoxNextId = 1;
let csaBoxItems = [];
let csaBoxItemNextId = 1;

app.get('/api/csa/members', (_req, res) => res.json(csaMembers));

app.post('/api/csa/members', (req, res) => {
  const member = { id: csaMemberNextId++, ...req.body, created_at: new Date().toISOString() };
  csaMembers.push(member);
  res.status(201).json(member);
});

app.put('/api/csa/members/:id', (req, res) => {
  const member = csaMembers.find(m => m.id === parseInt(req.params.id));
  if (!member) return res.status(404).json({ error: 'Not found' });
  Object.assign(member, req.body);
  res.json(member);
});

app.get('/api/csa/boxes', (_req, res) => {
  const result = csaBoxes.map(b => ({
    ...b,
    item_count: csaBoxItems.filter(i => i.csa_box_id === b.id).length,
  }));
  res.json(result);
});

app.post('/api/csa/boxes', (req, res) => {
  const box = { id: csaBoxNextId++, ...req.body, created_at: new Date().toISOString() };
  csaBoxes.push(box);
  res.status(201).json(box);
});

app.put('/api/csa/boxes/:id', (req, res) => {
  const box = csaBoxes.find(b => b.id === parseInt(req.params.id));
  if (!box) return res.status(404).json({ error: 'Not found' });
  Object.assign(box, req.body);
  res.json(box);
});

app.get('/api/csa/boxes/:id', (req, res) => {
  const box = csaBoxes.find(b => b.id === parseInt(req.params.id));
  if (!box) return res.status(404).json({ error: 'Not found' });
  const boxItemsList = csaBoxItems
    .filter(bi => bi.csa_box_id === box.id)
    .map(bi => {
      const inv = items.find(i => i.id === bi.inventory_item_id);
      return {
        id: bi.id,
        inventory_item_id: bi.inventory_item_id,
        quantity: bi.quantity,
        item_name: inv?.item_name || 'Unknown',
        brand: inv?.brand || '',
        size: inv?.size || '',
        qty_available: inv?.qty_available || 0,
      };
    });
  const activeMembers = csaMembers.filter(m => m.subscription_status === 'active').length;
  res.json({ ...box, items: boxItemsList, active_member_count: activeMembers });
});

app.post('/api/csa/boxes/:id/items', (req, res) => {
  const boxId = parseInt(req.params.id);
  const box = csaBoxes.find(b => b.id === boxId);
  if (!box) return res.status(404).json({ error: 'Box not found' });
  const bi = { id: csaBoxItemNextId++, csa_box_id: boxId, inventory_item_id: req.body.inventory_item_id, quantity: req.body.quantity || 1 };
  csaBoxItems.push(bi);
  res.status(201).json(bi);
});

app.delete('/api/csa/boxes/:boxId/items/:itemId', (req, res) => {
  const itemId = parseInt(req.params.itemId);
  csaBoxItems = csaBoxItems.filter(bi => bi.id !== itemId);
  res.json({ message: 'Removed' });
});

// Serve frontend in production
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Outer Isles mock server running on http://localhost:${PORT}`);
});
