const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'chicken-farm-secret-key-change-in-production';

module.exports = (db) => {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log('Login attempt:', { username, passwordLength: password ? password.length : 0 });

    const admin = db.get('admin').value();

    if (!admin) {
      console.log('Admin not found in db');
      return res.status(401).json({ error: 'Admin not found' });
    }

    if (username !== admin.username) {
      console.log('Username mismatch:', username, 'vs', admin.username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let passwordMatch = false;

    if (admin.password && admin.password.startsWith('$2')) {
      // Bcrypt hash
      passwordMatch = bcrypt.compareSync(password, admin.password);
      console.log('Using bcrypt check:', passwordMatch);
    } else {
      // Plain text
      passwordMatch = (password === admin.password);
      console.log('Using plain text check:', passwordMatch);
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { username: username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token: token });
  });

  return router;
};