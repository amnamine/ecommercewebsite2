const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = 10000;
const DB_PATH = path.join(__dirname, 'db.sqlite');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize SQLite DB
const db = new sqlite3.Database(DB_PATH);

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb() {
  await run(db, `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 10,
    category TEXT
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_email TEXT,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TEXT NOT NULL
  )`);

  await run(db, `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  const existing = await get(db, 'SELECT COUNT(*) as count FROM products');
  if (!existing || existing.count === 0) {
    const sample = [
      {
        name: 'Aurora Headphones',
        description: 'Wireless over-ear headphones with noise cancelation.',
        price: 129.99,
        image_url: 'https://images.unsplash.com/photo-1518441902119-7f8e8f1f7f6f?q=80&w=640&auto=format&fit=crop',
        stock: 20,
        category: 'Audio'
      },
      {
        name: 'Nimbus Smartwatch',
        description: 'Fitness tracking, heart-rate, and notifications in a sleek body.',
        price: 199.00,
        image_url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?q=80&w=640&auto=format&fit=crop',
        stock: 15,
        category: 'Wearables'
      },
      {
        name: 'Luma Desk Lamp',
        description: 'Minimal LED lamp with adjustable brightness and color.',
        price: 59.50,
        image_url: 'https://images.unsplash.com/photo-1507473885763-8b59eeb1d30f?q=80&w=640&auto=format&fit=crop',
        stock: 30,
        category: 'Home'
      },
      {
        name: 'Vertex Backpack',
        description: 'Water-resistant backpack with padded laptop compartment.',
        price: 89.99,
        image_url: 'https://images.unsplash.com/photo-1520975680476-1b4568dc2094?q=80&w=640&auto=format&fit=crop',
        stock: 25,
        category: 'Lifestyle'
      },
      {
        name: 'Flux Wireless Charger',
        description: 'Fast 15W charging pad with soft-touch finish.',
        price: 29.99,
        image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=640&auto=format&fit=crop',
        stock: 40,
        category: 'Accessories'
      },
      {
        name: 'Cascade Water Bottle',
        description: 'Insulated steel bottle keeps drinks cold for 24 hours.',
        price: 24.95,
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=640&auto=format&fit=crop',
        stock: 50,
        category: 'Lifestyle'
      },
      {
        name: 'Pulse Bluetooth Speaker',
        description: 'Compact speaker with deep bass and 12-hour battery.',
        price: 49.99,
        image_url: 'https://images.unsplash.com/photo-1585386959984-a4155223166f?q=80&w=640&auto=format&fit=crop',
        stock: 35,
        category: 'Audio'
      },
      {
        name: 'Orbit Desk Organizer',
        description: 'Keep your workspace tidy with modular compartments.',
        price: 39.00,
        image_url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=640&auto=format&fit=crop',
        stock: 22,
        category: 'Home'
      },
      {
        name: 'Zen Ergonomic Mouse',
        description: 'Reduce wrist strain with a sculpted vertical design.',
        price: 59.00,
        image_url: 'https://images.unsplash.com/photo-1587825140400-2343c11bf63e?q=80&w=640&auto=format&fit=crop',
        stock: 28,
        category: 'Accessories'
      },
      {
        name: 'Sierra Sunglasses',
        description: 'Polarized lenses with lightweight acetate frame.',
        price: 74.99,
        image_url: 'https://images.unsplash.com/photo-1512149673954-1f0b76c6ab81?q=80&w=640&auto=format&fit=crop',
        stock: 18,
        category: 'Lifestyle'
      },
      {
        name: 'Echo Keyboard',
        description: 'Low-profile mechanical keyboard with RGB backlight.',
        price: 99.00,
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=640&auto=format&fit=crop',
        stock: 17,
        category: 'Accessories'
      },
      {
        name: 'Nova LED Strip',
        description: 'Ambient lighting strip with app-controlled scenes.',
        price: 34.99,
        image_url: 'https://images.unsplash.com/photo-1517404215738-1520603e5a2b?q=80&w=640&auto=format&fit=crop',
        stock: 45,
        category: 'Home'
      }
    ];

    const stmt = db.prepare('INSERT INTO products (name, description, price, image_url, stock, category) VALUES (?,?,?,?,?,?)');
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        sample.forEach(p => {
          stmt.run([p.name, p.description, p.price, p.image_url, p.stock, p.category]);
        });
        stmt.finalize(err => err ? reject(err) : resolve());
      });
    });
  }
}

// API routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/products', async (req, res) => {
  try {
    const { q, category } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];
    const where = [];
    if (q) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY id DESC';
    const products = await all(db, sql, params);
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await get(db, 'SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const cats = await all(db, 'SELECT DISTINCT category FROM products ORDER BY category');
    res.json(cats.map(c => c.category));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customer } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items required' });
    }

    // Validate stock and compute total
    let total = 0;
    for (const it of items) {
      const p = await get(db, 'SELECT * FROM products WHERE id = ?', [it.product_id]);
      if (!p) return res.status(400).json({ error: `Product ${it.product_id} missing` });
      if (p.stock < it.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
      total += p.price * it.quantity;
    }

    const createdAt = new Date().toISOString();
    const orderRun = await run(db, 'INSERT INTO orders (customer_name, customer_email, total, status, created_at) VALUES (?,?,?,?,?)', [customer?.name || null, customer?.email || null, total, 'created', createdAt]);
    const orderId = orderRun.lastID;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        items.forEach(it => {
          insertItem.run([orderId, it.product_id, it.quantity, it.price ?? null]);
          updateStock.run([it.quantity, it.product_id]);
        });
        insertItem.finalize(err => err ? reject(err) : resolve());
        updateStock.finalize(() => {});
      });
    });

    res.json({ id: orderId, total, status: 'created', created_at: createdAt });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Fallback to index.html for frontend routes
// Home route for SPA entry
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to init DB', err);
  process.exit(1);
});
