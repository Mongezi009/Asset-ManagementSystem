import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Axios interceptor for auth
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        {user && <Navigation user={user} onLogout={logout} />}
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/assets" element={user ? <AssetList /> : <Navigate to="/login" />} />
          <Route path="/assets/new" element={user ? <AssetForm /> : <Navigate to="/login" />} />
          <Route path="/assets/:id" element={user ? <AssetDetail /> : <Navigate to="/login" />} />
          <Route path="/scan" element={user ? <ScanPage /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

function Navigation({ user, onLogout }) {
  return (
    <nav className="nav">
      <div className="nav-brand">Asset Management</div>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/assets">Assets</Link>
        <Link to="/scan">Scan</Link>
        <span className="nav-user">{user.username}</span>
        <button onClick={onLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { username, password });
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Asset Management System</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="hint">Default: admin / admin123</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, scansRes] = await Promise.all([
        axios.get(`${API_URL}/reports/summary`),
        axios.get(`${API_URL}/scans/recent`)
      ]);
      setSummary(summaryRes.data);
      setRecentScans(scansRes.data.slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  if (!summary) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Assets</h3>
          <div className="stat-value">{summary.totalAssets}</div>
        </div>
        <div className="stat-card">
          <h3>Recent Scans (7 days)</h3>
          <div className="stat-value">{summary.recentScans}</div>
        </div>
        <div className="stat-card">
          <h3>Categories</h3>
          <div className="stat-value">{summary.assetsByCategory.length}</div>
        </div>
      </div>

      <div className="section">
        <h2>Assets by Status</h2>
        <div className="list">
          {summary.assetsByStatus.map(item => (
            <div key={item.status} className="list-item">
              <span>{item.status}</span>
              <span className="badge">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Recent Scans</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>User</th>
                <th>Location</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map(scan => (
                <tr key={scan.id}>
                  <td>{scan.asset_tag} - {scan.asset_name}</td>
                  <td>{scan.username}</td>
                  <td>{scan.location_name}</td>
                  <td>{new Date(scan.scanned_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssetList() {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssets();
  }, [search]);

  const fetchAssets = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/assets`, { params: { search } });
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch assets', err);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Assets</h1>
        <button onClick={() => navigate('/assets/new')} className="btn-primary">Add Asset</button>
      </div>
      <input
        type="text"
        placeholder="Search assets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.asset_tag}</td>
                <td>{asset.name}</td>
                <td>{asset.category_name}</td>
                <td>{asset.location_name}</td>
                <td><span className={`status-badge ${asset.status.toLowerCase()}`}>{asset.status}</span></td>
                <td>
                  <button onClick={() => navigate(`/assets/${asset.id}`)} className="btn-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetForm() {
  const [formData, setFormData] = useState({
    asset_tag: '',
    name: '',
    description: '',
    category_id: '',
    location_id: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    condition: 'Good',
    status: 'Active'
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/locations`)
      ]);
      setCategories(catRes.data);
      setLocations(locRes.data);
    } catch (err) {
      console.error('Failed to fetch options', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/assets`, formData);
      navigate('/assets');
    } catch (err) {
      alert('Failed to create asset: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <h1>Add New Asset</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <input name="asset_tag" placeholder="Asset Tag *" onChange={handleChange} required />
          <input name="name" placeholder="Name *" onChange={handleChange} required />
        </div>
        <textarea name="description" placeholder="Description" onChange={handleChange} />
        <div className="form-row">
          <select name="category_id" onChange={handleChange} required>
            <option value="">Select Category *</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select name="location_id" onChange={handleChange}>
            <option value="">Select Location</option>
            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>
        </div>
        <input name="serial_number" placeholder="Serial Number" onChange={handleChange} />
        <div className="form-row">
          <input type="date" name="purchase_date" placeholder="Purchase Date" onChange={handleChange} />
          <input type="number" name="purchase_price" placeholder="Purchase Price" onChange={handleChange} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">Create Asset</button>
          <button type="button" onClick={() => navigate('/assets')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function AssetDetail() {
  const [asset, setAsset] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const { id } = window.location.pathname.split('/').pop();

  useEffect(() => {
    fetchAsset();
    fetchQRCode();
  }, []);

  const fetchAsset = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/assets/${id}`);
      setAsset(data);
    } catch (err) {
      console.error('Failed to fetch asset', err);
    }
  };

  const fetchQRCode = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/assets/${id}/qrcode`);
      setQrCode(data.qrCode);
    } catch (err) {
      console.error('Failed to fetch QR code', err);
    }
  };

  const printAsset = () => {
    window.print();
  };

  if (!asset) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>Asset Details</h1>
        <button onClick={printAsset} className="btn-primary">Print</button>
      </div>
      <div className="asset-detail">
        <div className="detail-section">
          <h2>{asset.name}</h2>
          <p className="asset-tag">Tag: {asset.asset_tag}</p>
          <div className="detail-grid">
            <div><strong>Category:</strong> {asset.category_name}</div>
            <div><strong>Location:</strong> {asset.location_name}</div>
            <div><strong>Status:</strong> <span className={`status-badge ${asset.status.toLowerCase()}`}>{asset.status}</span></div>
            <div><strong>Condition:</strong> {asset.condition}</div>
            {asset.serial_number && <div><strong>Serial:</strong> {asset.serial_number}</div>}
            {asset.purchase_date && <div><strong>Purchase Date:</strong> {asset.purchase_date}</div>}
            {asset.purchase_price && <div><strong>Price:</strong> ${asset.purchase_price}</div>}
          </div>
          {asset.description && (
            <div className="description">
              <strong>Description:</strong>
              <p>{asset.description}</p>
            </div>
          )}
        </div>
        {qrCode && (
          <div className="qr-section">
            <h3>QR Code</h3>
            <img src={qrCode} alt="QR Code" className="qr-code" />
          </div>
        )}
      </div>

      {asset.scans && asset.scans.length > 0 && (
        <div className="section">
          <h3>Scan History</h3>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Location</th>
                <th>Type</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {asset.scans.map(scan => (
                <tr key={scan.id}>
                  <td>{scan.username}</td>
                  <td>{scan.location_name}</td>
                  <td>{scan.scan_type}</td>
                  <td>{new Date(scan.scanned_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScanPage() {
  const [assetTag, setAssetTag] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      await axios.post(`${API_URL}/scans`, { asset_tag: assetTag, scan_type: 'check' });
      setResult(`Successfully scanned: ${assetTag}`);
      setAssetTag('');
    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed');
    }
  };

  return (
    <div className="container">
      <h1>Scan Asset</h1>
      <div className="scan-container">
        <form onSubmit={handleScan} className="scan-form">
          <input
            type="text"
            placeholder="Enter or scan asset tag..."
            value={assetTag}
            onChange={(e) => setAssetTag(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" className="btn-primary">Submit Scan</button>
        </form>
        {result && <div className="success-message">{result}</div>}
        {error && <div className="error-message">{error}</div>}
        <p className="hint">Use Android app for barcode scanning or enter asset tag manually</p>
      </div>
    </div>
  );
}

export default App;
