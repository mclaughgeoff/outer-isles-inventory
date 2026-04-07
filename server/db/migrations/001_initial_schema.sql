-- Outer Isles Inventory Management — Initial Schema

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id),
  item_name VARCHAR(255) NOT NULL,
  format VARCHAR(100),
  brand VARCHAR(255),
  sub_sku TEXT,
  size VARCHAR(50),
  moq INT,
  distributor VARCHAR(100),
  delivery_minimum DECIMAL(10,2),
  shipping_cost VARCHAR(100),
  wholesale_cost DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  square_item_id VARCHAR(255),
  square_variation_id VARCHAR(255),
  square_sync_status VARCHAR(20) DEFAULT 'unlinked',
  tax_category VARCHAR(50) DEFAULT 'standard',
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Levels
CREATE TABLE IF NOT EXISTS stock_levels (
  id SERIAL PRIMARY KEY,
  inventory_item_id INT REFERENCES inventory_items(id) UNIQUE,
  qty_on_shelf INT DEFAULT 0,
  qty_in_back INT DEFAULT 0,
  qty_in_transit INT DEFAULT 0,
  qty_reserved_csa INT DEFAULT 0,
  reorder_point INT DEFAULT 2,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  inventory_item_id INT REFERENCES inventory_items(id),
  movement_type VARCHAR(30) NOT NULL,
  quantity INT NOT NULL,
  from_location VARCHAR(20),
  to_location VARCHAR(20),
  reference_type VARCHAR(30),
  reference_id INT,
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  delivery_minimum DECIMAL(10,2),
  shipping_policy TEXT,
  integrates_with_square BOOLEAN DEFAULT false,
  contact_info JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  vendor_id INT REFERENCES vendors(id),
  status VARCHAR(20) DEFAULT 'draft',
  order_date DATE,
  expected_delivery DATE,
  actual_delivery DATE,
  total_cost DECIMAL(10,2),
  shipping_cost DECIMAL(10,2),
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id INT REFERENCES inventory_items(id),
  quantity_ordered INT NOT NULL,
  quantity_received INT DEFAULT 0,
  unit_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  kitchen_name VARCHAR(255),
  category VARCHAR(100),
  price DECIMAL(10,2),
  tax_category VARCHAR(50) DEFAULT 'meal_tax',
  is_active BOOLEAN DEFAULT true,
  square_item_id VARCHAR(255),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Item Ingredients
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id SERIAL PRIMARY KEY,
  menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id INT REFERENCES inventory_items(id),
  quantity_used DECIMAL(10,3),
  unit VARCHAR(20),
  notes TEXT
);

-- Modifier Groups
CREATE TABLE IF NOT EXISTS modifier_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_required BOOLEAN DEFAULT false,
  min_selections INT DEFAULT 0,
  max_selections INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modifier Options
CREATE TABLE IF NOT EXISTS modifier_options (
  id SERIAL PRIMARY KEY,
  modifier_group_id INT REFERENCES modifier_groups(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  upcharge DECIMAL(10,2) DEFAULT 0,
  inventory_item_id INT REFERENCES inventory_items(id),
  quantity_used DECIMAL(10,3),
  unit VARCHAR(20)
);

-- Menu Item ↔ Modifier Groups
CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
  menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
  modifier_group_id INT REFERENCES modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, modifier_group_id)
);

-- CSA Members
CREATE TABLE IF NOT EXISTS csa_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  subscription_status VARCHAR(20) DEFAULT 'active',
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CSA Weekly Boxes
CREATE TABLE IF NOT EXISTS csa_weekly_boxes (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CSA Box Items
CREATE TABLE IF NOT EXISTS csa_box_items (
  id SERIAL PRIMARY KEY,
  csa_box_id INT REFERENCES csa_weekly_boxes(id) ON DELETE CASCADE,
  inventory_item_id INT REFERENCES inventory_items(id),
  menu_item_id INT REFERENCES menu_items(id),
  quantity INT DEFAULT 1,
  notes TEXT,
  CONSTRAINT one_item_type CHECK (
    (inventory_item_id IS NOT NULL AND menu_item_id IS NULL) OR
    (inventory_item_id IS NULL AND menu_item_id IS NOT NULL)
  )
);

-- CSA Member Addons
CREATE TABLE IF NOT EXISTS csa_member_addons (
  id SERIAL PRIMARY KEY,
  csa_member_id INT REFERENCES csa_members(id),
  csa_box_id INT REFERENCES csa_weekly_boxes(id),
  inventory_item_id INT REFERENCES inventory_items(id),
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory_items(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_distributor ON inventory_items(distributor);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_vendor ON purchase_orders(vendor_id);
