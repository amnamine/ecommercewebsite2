// server.js
// Optimized for Render.com deployment with SQLite on a persistent disk.

// --- Dependencies ---
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// --- Initialize Express App ---
const app = express();
// Render sets the PORT environment variable. Default to 3000 for local development.
const PORT = process.env.PORT || 3000;

// --- Database Setup ---
// --- IMPORTANT FOR RENDER.COM ---
// Render provides RENDER_DATA_DIR as the mount path for persistent disks.
// Use this path for your SQLite database file.
// For local development, it will default to the project's root directory.
const dataDir = process.env.RENDER_DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'database.sqlite');

console.log(`SQLite Database Path: ${dbPath}`); // Log the path for debugging

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        // Consider how your app should behave if DB connection fails.
        // For now, we'll log and continue, but routes might fail.
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase(); // Create tables if they don't exist
    }
});

// Function to initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Products Table
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                price REAL NOT NULL,
                imageUrl TEXT,
                description TEXT,
                badge TEXT,
                stock INTEGER DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error('Error creating products table:', err.message);
            } else {
                console.log('Products table checked/created successfully.');
                seedProducts(); // Seed initial data if table is new/empty
            }
        });

        // Newsletter Subscriptions Table
        db.run(`
            CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating newsletter_subscriptions table:', err.message);
            } else {
                console.log('Newsletter subscriptions table checked/created successfully.');
            }
        });
    });
}

// Function to seed initial product data
function seedProducts() {
    const sampleProducts = [
        { name: "Smartphone Alpha", category: "Mobile Phones", price: 799.99, imageUrl: "https://placehold.co/300x300/E0E0E0/B0B0B0?text=Smartphone", description: "Next-gen smartphone with AI features.", badge: "New", stock: 50 },
        { name: "Laptop UltraSlim", category: "Laptops", price: 1250.00, imageUrl: "https://placehold.co/300x300/D8D8D8/A8A8A8?text=Laptop", description: "Lightweight and powerful for on-the-go productivity.", badge: "Sale", stock: 30 },
        { name: "AudioBliss Headphones", category: "Audio", price: 249.50, imageUrl: "https://placehold.co/300x300/E8E8E8/B8B8B8?text=Headphones", description: "Immersive sound with active noise cancellation.", badge: null, stock: 75 },
        { name: "Smartwatch Pro X", category: "Wearables", price: 429.00, imageUrl: "https://placehold.co/300x300/F0F0F0/C0C0C0?text=Smartwatch", description: "Advanced health tracking and seamless connectivity.", badge: "Hot", stock: 40 },
        { name: "Gaming Rig Titan", category: "Gaming", price: 1999.00, imageUrl: "https://placehold.co/300x300/C2E0FF/5C85A6?text=Gaming+PC", description: "Ultimate performance for serious gamers.", badge: "New", stock: 15 },
        { name: "Portable SoundWave Speaker", category: "Audio", price: 99.99, imageUrl: "https://placehold.co/300x300/FFDDC2/A67C5C?text=Speaker", description: "Compact speaker with rich, room-filling sound.", badge: null, stock: 100 }
    ];

    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error("Error checking product count:", err.message);
            return;
        }
        if (row.count === 0) {
            console.log("Seeding initial products into the database...");
            const stmt = db.prepare("INSERT INTO products (name, category, price, imageUrl, description, badge, stock) VALUES (?, ?, ?, ?, ?, ?, ?)");
            sampleProducts.forEach(product => {
                stmt.run(product.name, product.category, product.price, product.imageUrl, product.description, product.badge, product.stock);
            });
            stmt.finalize((err) => {
                if (err) {
                    console.error("Error seeding products:", err.message);
                } else {
                    console.log("Initial products seeded successfully.");
                }
            });
        } else {
            console.log("Products table already contains data. Skipping seed operation.");
        }
    });
}

// --- Middleware ---
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Serve static files (HTML, CSS, JS) from the root directory.
// If your static files are in a 'public' folder, change to:
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/')));


// --- API Routes ---

// GET: Fetch all products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products ORDER BY category, name", [], (err, rows) => {
        if (err) {
            console.error("Error fetching products from database:", err.message);
            res.status(500).json({ error: 'Failed to retrieve products.' });
            return;
        }
        res.json(rows);
    });
});

// GET: Fetch a single product by ID
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID format.' });
    }

    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
        if (err) {
            console.error(`Error fetching product with ID ${productId}:`, err.message);
            return res.status(500).json({ error: 'Failed to retrieve product details.' });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Product not found.' });
        }
    });
});

// POST: Subscribe to newsletter
app.post('/api/newsletter/subscribe', (req, res) => {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { // Basic email format validation
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const stmt = db.prepare("INSERT INTO newsletter_subscriptions (email) VALUES (?)");
    stmt.run(email.toLowerCase(), function(err) { // Store email in lowercase for consistency
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'This email address is already subscribed.' });
            }
            console.error("Error subscribing email to newsletter:", err.message);
            return res.status(500).json({ error: 'Failed to process newsletter subscription.' });
        }
        console.log(`New newsletter subscription: ${email} (ID: ${this.lastID})`);
        res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!', id: this.lastID });
    });
    stmt.finalize();
});

// --- Frontend Route ---
// Serves index.html for the root path and any other unhandled GET requests (for client-side routing if you add it later)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) { // Don't serve index.html for API routes
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            // If index.html is not found, or another error occurs
            if (!res.headersSent) { // Check if headers are already sent
                 res.status(500).send("Error serving the application.");
            }
        }
    });
});


// --- Error Handling Middleware (Basic) ---
// This should be defined after all other routes and middleware.
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    if (!res.headersSent) {
        res.status(500).send('An unexpected error occurred on the server!');
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} (or your Render URL)`);
    console.log(`Static files are being served from: ${path.join(__dirname, '/')}`);
    console.log('Press Ctrl+C to quit if running locally.');
});

// --- Graceful Shutdown ---
function gracefulShutdown() {
    console.log('Attempting graceful shutdown...');
    db.close((err) => {
        if (err) {
            console.error('Error closing SQLite database:', err.message);
        } else {
            console.log('SQLite database connection closed successfully.');
        }
        console.log('Server shut down.');
        process.exit(0);
    });
}

process.on('SIGINT', gracefulShutdown); // Catches Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Catches kill signals (like from Render during deploys)

