const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

const PORT = 10000;
const DB_JSON = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db = { products: [], orders: [], order_items: [] };

function saveDb() {
  fs.writeFileSync(DB_JSON, JSON.stringify(db, null, 2));
}

function nextId(arr) {
  if (!arr.length) return 1;
  return Math.max(...arr.map(x => x.id)) + 1;
}

function seedProducts() {
  const sample = [
    { name: 'Aurora Headphones', description: 'Wireless over-ear headphones with noise cancelation.', price: 129.99, image_url: 'https://images.unsplash.com/photo-1518441902119-7f8e8f1f7f6f?q=80&w=640&auto=format&fit=crop', stock: 20, category: 'Audio' },
    { name: 'Nimbus Smartwatch', description: 'Fitness tracking, heart-rate, and notifications in a sleek body.', price: 199.00, image_url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=640&auto=format&fit=crop', stock: 15, category: 'Wearables' },
    { name: 'Luma Desk Lamp', description: 'Minimal LED lamp with adjustable brightness and color.', price: 59.50, image_url: 'https://images.unsplash.com/photo-1507473885763-8b59eeb1d30f?q=80&w=640&auto=format&fit=crop', stock: 30, category: 'Home' },
    { name: 'Vertex Backpack', description: 'Water-resistant backpack with padded laptop compartment.', price: 89.99, image_url: 'https://images.unsplash.com/photo-1520975680476-1b4568dc2094?q=80&w=640&auto=format&fit=crop', stock: 25, category: 'Lifestyle' },
    { name: 'Flux Wireless Charger', description: 'Fast 15W charging pad with soft-touch finish.', price: 29.99, image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=640&auto=format&fit=crop', stock: 40, category: 'Accessories' },
    { name: 'Cascade Water Bottle', description: 'Insulated steel bottle keeps drinks cold for 24 hours.', price: 24.95, image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=640&auto=format&fit=crop', stock: 50, category: 'Lifestyle' },
    { name: 'Pulse Bluetooth Speaker', description: 'Compact speaker with deep bass and 12-hour battery.', price: 49.99, image_url: 'https://images.unsplash.com/photo-1585386959984-a4155223166f?q=80&w=640&auto=format&fit=crop', stock: 35, category: 'Audio' },
    { name: 'Orbit Desk Organizer', description: 'Keep your workspace tidy with modular compartments.', price: 39.00, image_url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=640&auto=format&fit=crop', stock: 22, category: 'Home' },
    { name: 'Zen Ergonomic Mouse', description: 'Reduce wrist strain with a sculpted vertical design.', price: 59.00, image_url: 'https://images.unsplash.com/photo-1587825140400-2343c11bf63e?q=80&w=640&auto=format&fit=crop', stock: 28, category: 'Accessories' },
    { name: 'Sierra Sunglasses', description: 'Polarized lenses with lightweight acetate frame.', price: 74.99, image_url: 'https://images.unsplash.com/photo-1512149673954-1f0b76c6ab81?q=80&w=640&auto=format&fit=crop', stock: 18, category: 'Lifestyle' },
    { name: 'Echo Keyboard', description: 'Low-profile mechanical keyboard with RGB backlight.', price: 99.00, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=640&auto=format&fit=crop', stock: 17, category: 'Accessories' },
    { name: 'Nova LED Strip', description: 'Ambient lighting strip with app-controlled scenes.', price: 34.99, image_url: 'https://images.unsplash.com/photo-1517404215738-1520603e5a2b?q=80&w=640&auto=format&fit=crop', stock: 45, category: 'Home' }
  ];
  db.products = sample.map((p, i) => ({ id: i + 1, ...p }));
}

function initDb() {
  if (fs.existsSync(DB_JSON)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_JSON, 'utf-8'));
    } catch (e) {
      console.error('Failed to read db.json, reseeding.', e);
      seedProducts(); saveDb();
    }
  } else {
    seedProducts(); saveDb();
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Proxy remote images to avoid browser ORB blocking
app.get('/proxy-image', async (req, res) => {
  try {
    const src = req.query.url;
    if (!src) return res.status(400).json({ error: 'Missing url' });
    // Basic guard: only allow http/https
    const u = new URL(src);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return res.status(400).json({ error: 'Invalid protocol' });
    }
    const r = await fetch(src);
    if (!r.ok) {
      return res.status(r.status).end();
    }
    const ct = r.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', ct);
    res.setHeader('Content-Length', buf.length);
    // Hint to browser that cross-origin embedding is fine
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: 'Image proxy failed' });
  }
});

app.get('/api/products', (req, res) => {
  const { q, category } = req.query;
  let products = [...db.products];
  if (q) {
    const s = String(q).toLowerCase();
    products = products.filter(p => (p.name || '').toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s));
  }
  if (category) {
    products = products.filter(p => p.category === category);
  }
  products.sort((a,b)=>b.id-a.id);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = db.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.get('/api/categories', (req, res) => {
  const cats = Array.from(new Set(db.products.map(p => p.category))).sort();
  res.json(cats);
});

app.post('/api/orders', (req, res) => {
  const { items, customer } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }

  let total = 0;
  for (const it of items) {
    const p = db.products.find(x => x.id === it.product_id);
    if (!p) return res.status(400).json({ error: `Product ${it.product_id} missing` });
    if (p.stock < it.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
    total += p.price * it.quantity;
  }

  const createdAt = new Date().toISOString();
  const orderId = nextId(db.orders);
  db.orders.push({ id: orderId, customer_name: customer?.name || null, customer_email: customer?.email || null, total, status: 'created', created_at: createdAt });
  for (const it of items) {
    db.order_items.push({ id: nextId(db.order_items), order_id: orderId, product_id: it.product_id, quantity: it.quantity, price: null });
    const p = db.products.find(x => x.id === it.product_id);
    p.stock -= it.quantity;
  }
  saveDb();
  res.json({ id: orderId, total, status: 'created', created_at: createdAt });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDb();
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
