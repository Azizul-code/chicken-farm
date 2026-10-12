const express = require('express');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'chicken-farm-secret-key';

module.exports = (db) => {
  const router = express.Router();

  router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign({ username: username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token: token });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });

  return router;
};