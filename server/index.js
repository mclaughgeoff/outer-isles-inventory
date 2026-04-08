require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// If no DATABASE_URL, run the mock server (works without PostgreSQL)
if (!process.env.DATABASE_URL) {
  console.log('No DATABASE_URL found — starting in mock mode (in-memory data)');
  require('./mock-server');
  return;
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve logo assets
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));

// Serve React frontend in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Outer Isles server running on port ${PORT}`);
});
