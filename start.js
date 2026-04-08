// Bombproof entry point — ALWAYS starts a server no matter what
const http = require('http');
const PORT = process.env.PORT || 5000;

try {
  require('./server/index.js');
} catch (err) {
  // If ANYTHING fails, start a bare minimum server so the deployment doesn't 500
  console.error('=== STARTUP ERROR ===');
  console.error(err);
  console.error('=== Starting emergency fallback server ===');

  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  const app = express();

  // Try serving the built frontend
  const clientDist = path.join(__dirname, 'client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
  }

  app.get('/api/*', (_req, res) => {
    res.json({ error: 'Server starting up — please refresh in a moment' });
  });

  app.get('*', (_req, res) => {
    if (fs.existsSync(path.join(clientDist, 'index.html'))) {
      res.sendFile(path.join(clientDist, 'index.html'));
    } else {
      res.send(`<html><body><h1>Outer Isles</h1><p>Server is starting... Error: ${err.message}</p><p>Refresh in a moment.</p></body></html>`);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Emergency fallback server on port ${PORT}`);
  });
}
