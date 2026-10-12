const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.customer || !data.items || data.items.length === 0) {
      return res.status(400).json({ error: 'Invalid order' });
    }
    const order = {
      id: uuidv4().slice(0, 8).toUpperCase(),
      customer: data.customer,
      items: data.items,
      total: data.total,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    data.items.forEach(item => {
      const product = db.get('products').find({ id: item.id }).value();
      if (product) {
        db.get('products').find({ id: item.id }).assign({ stock: Math.max(0, product.stock - item.quantity) }).write();
      }
    });
    db.get('orders').push(order).write();
    res.status(201).json(order);
  });

  router.get('/', (req, res) => {
    res.json(db.get('orders').value().reverse());
  });

  router.get('/:id', (req, res) => {
    const order = db.get('orders').find({ id: req.params.id }).value();
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  });

  router.put('/:id', (req, res) => {
    const order = db.get('orders').find({ id: req.params.id }).value();
    if (!order) return res.status(404).json({ error: 'Not found' });
    db.get('orders').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('orders').find({ id: req.params.id }).value());
  });

  return router;
};