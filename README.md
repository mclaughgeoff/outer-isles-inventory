# Outer Isles Inventory Management System

A full-stack inventory management application for Outer Isles, a specialty grocery store in Hanover, MA. Tracks inventory across walk-in grocery, prepared foods/sandwiches, and CSA subscription boxes.

## Tech Stack

- **Frontend:** React 18 + Tailwind CSS + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Hosting:** Replit

## Quick Start (Replit)

1. Import this repo into Replit
2. Add a PostgreSQL database (Replit will set `DATABASE_URL` automatically)
3. Set `JWT_SECRET` in Secrets (any random string)
4. Run the setup:
   ```bash
   npm install
   cd client && npm install && cd ..
   npm run db:migrate
   npm run db:seed
   npm run build
   ```
5. Click Run

## Default Login

- **Email:** admin@outerisles.com
- **Password:** outerisles2024

## Development

```bash
# Install dependencies
npm install && cd client && npm install && cd ..

# Set up database
npm run db:migrate
npm run db:seed

# Run dev servers (backend + frontend)
npm run dev
```

## Features (Phase 1)

- Dashboard with key metrics and alerts
- Inventory browser with search/filter (210+ items pre-loaded)
- Item detail with full edit, pricing, and ordering info
- Stock level tracking (shelf / back / transit / CSA reserved)
- Stock movement logging and audit trail
- Move stock between locations
- Receive shipments
- Menu item catalog
- Vendor directory
- Purchase order tracking
- JWT-based authentication
