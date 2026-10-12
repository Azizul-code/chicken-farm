const express = require('express');
const { v4: uuidv4 } = require('uuid');

module.exports = (db) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const category = req.query.category;
    const search = req.query.search;
    let products = db.get('products').value();
    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (search) {
      products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    res.json(products);
  });

  router.get('/:id', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const product = db.get('products').find({ id: req.params.id }).value();
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  });

  router.post('/', (req, res) => {
    const data = req.body;
    if (!data.name || !data.price) return res.status(400).json({ error: 'Name and price required' });
    const newProduct = {
      id: uuidv4(),
      name: data.name,
      price: Number(data.price),
      unit: data.unit || 'à¦•à§‡à¦œà¦¿',
      stock: Number(data.stock) || 0,
      image: data.image || 'https://via.placeholder.com/300',
      description: data.description || '',
      category: data.category || 'à¦®à§à¦°à¦—à¦¿'
    };
    db.get('products').push(newProduct).write();
    res.status(201).json(newProduct);
  });

  router.put('/:id', (req, res) => {
    const product = db.get('products').find({ id: req.params.id }).value();
    if (!product) return res.status(404).json({ error: 'Not found' });
    db.get('products').find({ id: req.params.id }).assign(req.body).write();
    res.json(db.get('products').find({ id: req.params.id }).value());
  });

  router.delete('/:id', (req, res) => {
    db.get('products').remove({ id: req.params.id }).write();
    res.json({ success: true });
  });

  return router;
};