const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const app = express();
const PORT = process.env.PORT || 5000;

const adapter = new FileSync(path.join(__dirname, 'data', 'db.json'));
const db = low(adapter);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============ API Routes ============
app.use('/api/products', require('./routes/products')(db));
app.use('/api/orders', require('./routes/orders')(db));
app.use('/api/auth', require('./routes/auth')(db));

// ============ Static frontend ============
const frontendPath = path.join(__dirname, '..', 'frontend');

// Serve CSS files explicitly
app.get('/css/:file', (req, res) => {
  const filePath = path.join(frontendPath, 'css', req.params.file);
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.sendFile(filePath);
});

// Serve JS files explicitly
app.get('/js/:file', (req, res) => {
  const filePath = path.join(frontendPath, 'js', req.params.file);
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.sendFile(filePath);
});

// Serve videos
app.get('/videos/:file', (req, res) => {
  const filePath = path.join(frontendPath, 'Videos', req.params.file);
  res.setHeader('Content-Type', 'video/mp4');
  res.sendFile(filePath);
});

// Serve Videos (capital V)
app.get('/Videos/:file', (req, res) => {
  const filePath = path.join(frontendPath, 'Videos', req.params.file);
  res.setHeader('Content-Type', 'video/mp4');
  res.sendFile(filePath);
});

// Serve HTML files
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/track.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(frontendPath, 'track.html'));
});

app.get('/admin.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(frontendPath, 'admin.html'));
});

// Static files fallback
app.use(express.static(frontendPath));

app.listen(PORT, function() {
  console.log('========================================');
  console.log('Chicken Farm Server running');
  console.log('Open: http://localhost:' + PORT);
  console.log('========================================');
});