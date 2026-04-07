# Outer Isles Inventory Management System

## Overview
Full-stack inventory management system for Outer Isles specialty grocery store. Tracks inventory across walk-in grocery, prepared foods/sandwiches, and CSA subscription boxes.

## Tech Stack
- **Frontend**: React 18, Tailwind CSS 3.4, Vite 5.3, React Router v6
- **Backend**: Node.js, Express 4
- **Database**: PostgreSQL (Replit built-in)
- **Auth**: JWT (bcryptjs for hashing)

## Project Structure
```
├── server/            # Express backend
│   ├── index.js       # Entry point (port 5000)
│   ├── db/            # Database pool, migrations, seed
│   ├── routes/        # API routes (auth, inventory, stock, etc.)
│   └── middleware/     # Error handling, JWT auth
├── client/            # React frontend (Vite)
│   ├── src/pages/     # Dashboard, Inventory, ItemDetail, CSA, POs
│   ├── src/components/# Sidebar, Layout, StockBadge
│   ├── src/context/   # AuthContext
│   └── src/services/  # API client
├── assets/            # Logo images
└── seed-data/         # Initial data JSON files
```

## Setup & Running
1. Database: PostgreSQL via Replit (DATABASE_URL auto-configured)
2. Secrets: JWT_SECRET (set in env vars)
3. Install: root + client npm packages
4. Migrate: `npm run db:migrate`
5. Seed: `npm run db:seed`
6. Build: `npm run build` (creates client/dist)
7. Start: `npm start` (serves built frontend + API on port 5000)

## Key Scripts
- `npm run dev` - Dev mode (concurrent server + vite dev)
- `npm start` - Production mode (serves built client)
- `npm run build` - Build client
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database

## Environment Variables
- `PORT` - Server port (5000)
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
