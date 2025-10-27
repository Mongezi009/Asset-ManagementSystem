const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'assets.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Categories table
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Locations table
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    building TEXT,
    floor TEXT,
    room TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Assets table
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    location_id INTEGER,
    serial_number TEXT,
    purchase_date DATE,
    purchase_price REAL,
    warranty_expiry DATE,
    condition TEXT DEFAULT 'Good',
    status TEXT DEFAULT 'Active',
    notes TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  -- Scans table (audit trail)
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    user_id INTEGER,
    scan_type TEXT DEFAULT 'check',
    location_id INTEGER,
    notes TEXT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  -- Maintenance records
  CREATE TABLE IF NOT EXISTS maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    maintenance_type TEXT,
    description TEXT,
    cost REAL,
    performed_by TEXT,
    performed_at DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id)
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_assets_tag ON assets(asset_tag);
  CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
  CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location_id);
  CREATE INDEX IF NOT EXISTS idx_scans_asset ON scans(asset_id);
  CREATE INDEX IF NOT EXISTS idx_scans_date ON scans(scanned_at);
`);

// Insert default admin user
const hashedPassword = bcrypt.hashSync('admin123', 10);
const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, email, role) 
  VALUES (?, ?, ?, ?)
`);
insertAdmin.run('admin', hashedPassword, 'admin@example.com', 'admin');

// Insert default categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)
`);
const categories = [
  ['Computers', 'Desktop computers, laptops, and tablets'],
  ['Monitors', 'Display screens and monitors'],
  ['Peripherals', 'Keyboards, mice, and other accessories'],
  ['Furniture', 'Desks, chairs, and office furniture'],
  ['Electronics', 'Phones, projectors, and other electronics'],
  ['Tools', 'Maintenance and repair tools'],
  ['Vehicles', 'Company vehicles and transportation'],
  ['Other', 'Miscellaneous items']
];
categories.forEach(cat => insertCategory.run(...cat));

// Insert default locations
const insertLocation = db.prepare(`
  INSERT OR IGNORE INTO locations (name, building, floor, room) VALUES (?, ?, ?, ?)
`);
const locations = [
  ['Headquarters - Floor 1', 'HQ', '1', 'Main Office'],
  ['Warehouse - Section A', 'Warehouse', 'Ground', 'Section A'],
  ['Storage Room', 'HQ', 'Basement', 'Storage']
];
locations.forEach(loc => insertLocation.run(...loc));

console.log('Database initialized successfully!');
console.log('Default admin credentials: username=admin, password=admin123');

db.close();
