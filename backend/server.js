require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
['data', 'uploads'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// Database connection
const dbPath = path.join(__dirname, 'data', 'assets.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    
    const { username, password, email, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, hashedPassword, email, role || 'user');
    
    res.status(201).json({ id: result.lastInsertRowid, username, email, role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ASSET ROUTES ====================
app.get('/api/assets', authenticateToken, (req, res) => {
  try {
    const { category, location, status, search } = req.query;
    let query = `
      SELECT a.*, c.name as category_name, l.name as location_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE 1=1
    `;
    const params = [];
    
    if (category) { query += ' AND a.category_id = ?'; params.push(category); }
    if (location) { query += ' AND a.location_id = ?'; params.push(location); }
    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (search) {
      query += ' AND (a.asset_tag LIKE ? OR a.name LIKE ? OR a.description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    query += ' ORDER BY a.created_at DESC';
    const assets = db.prepare(query).all(...params);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assets/:id', authenticateToken, (req, res) => {
  try {
    const asset = db.prepare(`
      SELECT a.*, c.name as category_name, l.name as location_name,
             l.building, l.floor, l.room
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.id = ?
    `).get(req.params.id);
    
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    
    // Get recent scans
    const scans = db.prepare(`
      SELECT s.*, u.username, l.name as location_name
      FROM scans s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.asset_id = ?
      ORDER BY s.scanned_at DESC
      LIMIT 10
    `).all(req.params.id);
    
    // Get maintenance history
    const maintenance = db.prepare(`
      SELECT * FROM maintenance WHERE asset_id = ? ORDER BY performed_at DESC
    `).all(req.params.id);
    
    res.json({ ...asset, scans, maintenance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assets', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { asset_tag, name, description, category_id, location_id, serial_number, 
            purchase_date, purchase_price, warranty_expiry, condition, status, notes } = req.body;
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const stmt = db.prepare(`
      INSERT INTO assets (asset_tag, name, description, category_id, location_id, 
                          serial_number, purchase_date, purchase_price, warranty_expiry, 
                          condition, status, notes, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(asset_tag, name, description, category_id, location_id, 
                           serial_number, purchase_date, purchase_price, warranty_expiry, 
                           condition || 'Good', status || 'Active', notes, image_url);
    
    res.status(201).json({ id: result.lastInsertRowid, asset_tag, name });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/assets/:id', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { name, description, category_id, location_id, serial_number, 
            purchase_date, purchase_price, warranty_expiry, condition, status, notes } = req.body;
    
    let image_url = req.body.image_url;
    if (req.file) image_url = `/uploads/${req.file.filename}`;
    
    const stmt = db.prepare(`
      UPDATE assets SET name = ?, description = ?, category_id = ?, location_id = ?,
                        serial_number = ?, purchase_date = ?, purchase_price = ?,
                        warranty_expiry = ?, condition = ?, status = ?, notes = ?,
                        image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(name, description, category_id, location_id, serial_number, 
             purchase_date, purchase_price, warranty_expiry, condition, status, 
             notes, image_url, req.params.id);
    
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/assets/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCAN ROUTES ====================
app.post('/api/scans', authenticateToken, (req, res) => {
  try {
    const { asset_tag, scan_type, location_id, notes } = req.body;
    
    const asset = db.prepare('SELECT id FROM assets WHERE asset_tag = ?').get(asset_tag);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    
    const stmt = db.prepare(`
      INSERT INTO scans (asset_id, user_id, scan_type, location_id, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(asset.id, req.user.id, scan_type || 'check', location_id, notes);
    res.status(201).json({ id: result.lastInsertRowid, asset_id: asset.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/scans/recent', authenticateToken, (req, res) => {
  try {
    const scans = db.prepare(`
      SELECT s.*, a.asset_tag, a.name as asset_name, u.username, l.name as location_name
      FROM scans s
      JOIN assets a ON s.asset_id = a.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.scanned_at DESC
      LIMIT 50
    `).all();
    res.json(scans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== QR CODE GENERATION ====================
app.get('/api/assets/:id/qrcode', authenticateToken, async (req, res) => {
  try {
    const asset = db.prepare('SELECT asset_tag, name FROM assets WHERE id = ?').get(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    
    const qrData = JSON.stringify({ asset_tag: asset.asset_tag, name: asset.name });
    const qrCode = await QRCode.toDataURL(qrData);
    res.json({ qrCode, asset_tag: asset.asset_tag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;
    const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const result = stmt.run(name, description);
    res.status(201).json({ id: result.lastInsertRowid, name, description });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== LOCATIONS ====================
app.get('/api/locations', authenticateToken, (req, res) => {
  try {
    const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/locations', authenticateToken, (req, res) => {
  try {
    const { name, building, floor, room } = req.body;
    const stmt = db.prepare('INSERT INTO locations (name, building, floor, room) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, building, floor, room);
    res.status(201).json({ id: result.lastInsertRowid, name, building, floor, room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== REPORTS ====================
app.get('/api/reports/summary', authenticateToken, (req, res) => {
  try {
    const totalAssets = db.prepare('SELECT COUNT(*) as count FROM assets').get();
    const assetsByStatus = db.prepare('SELECT status, COUNT(*) as count FROM assets GROUP BY status').all();
    const assetsByCategory = db.prepare(`
      SELECT c.name, COUNT(a.id) as count 
      FROM categories c 
      LEFT JOIN assets a ON c.id = a.category_id 
      GROUP BY c.id, c.name
    `).all();
    const recentScans = db.prepare('SELECT COUNT(*) as count FROM scans WHERE scanned_at > datetime("now", "-7 days")').get();
    
    res.json({
      totalAssets: totalAssets.count,
      assetsByStatus,
      assetsByCategory,
      recentScans: recentScans.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Asset Management API running on http://localhost:${PORT}`);
  console.log('Default credentials: username=admin, password=admin123');
});
