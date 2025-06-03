// server.js
// This is a basic Express.js server with SQLite integration for an e-commerce website.

// --- Dependencies ---
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // .verbose() for more detailed error messages

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// --- Database Setup ---
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
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
                badge TEXT, -- e.g., 'New', 'Sale', 'Hot'
                stock INTEGER DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error('Error creating products table:', err.message);
            } else {
                console.log('Products table checked/created successfully.');
                // Seed some initial product data if the table is empty (optional)
                seedProducts();
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

        // You could add more tables here (e.g., users, orders, cart_items)
    });
}

// Function to seed initial product data (example)
function seedProducts() {
    const sampleProducts = [
        { name: "Smartphone XYZ", category: "Mobile Phones", price: 699.99, imageUrl: "https://placehold.co/300x300/E0E0E0/B0B0B0?text=Smartphone", description: "Latest model with advanced features.", badge: "New", stock: 50 },
        { name: "Laptop ProMax", category: "Laptops", price: 1150.00, imageUrl: "https://placehold.co/300x300/D8D8D8/A8A8A8?text=Laptop", description: "Powerful laptop for professionals.", badge: "Sale", stock: 30 },
        { name: "Wireless Headphones", category: "Audio", price: 199.50, imageUrl: "https://placehold.co/300x300/E8E8E8/B8B8B8?text=Headphones", description: "Noise-cancelling wireless headphones.", badge: null, stock: 75 },
        { name: "Smartwatch Series 7", category: "Wearables", price: 399.00, imageUrl: "https://placehold.co/300x300/F0F0F0/C0C0C0?text=Smartwatch", description: "Feature-rich smartwatch for a healthy lifestyle.", badge: "Hot", stock: 40 },
        { name: "Gaming Console X", category: "Gaming", price: 499.00, imageUrl: "https://placehold.co/300x300/C2E0FF/5C85A6?text=Gaming+Console", description: "Next-gen gaming experience.", badge: "New", stock: 20 },
        { name: "Bluetooth Speaker", category: "Audio", price: 89.99, imageUrl: "https://placehold.co/300x300/FFDDC2/A67C5C?text=Speaker", description: "Portable and powerful sound.", badge: null, stock: 100 }
    ];

    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error("Error checking product count:", err.message);
            return;
        }
        if (row.count === 0) {
            console.log("Seeding initial products...");
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
            console.log("Products table already has data. Skipping seed.");
        }
    });
}


// --- Middleware ---
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// Serve static files (HTML, CSS, JS) from the 'public' directory (or root in this case)
// For this project structure, assuming index.html, styles.css, script.js are in the root.
// If you have a 'public' folder, change to app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/')));


// --- API Routes ---

// GET: Fetch all products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products ORDER BY category, name", [], (err, rows) => {
        if (err) {
            console.error("Error fetching products:", err.message);
            res.status(500).json({ error: 'Failed to retrieve products from database.' });
            return;
        }
        res.json(rows);
    });
});

// GET: Fetch a single product by ID (Example)
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
        return res.status(400).json({ error: 'Invalid product ID.' });
    }

    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
        if (err) {
            console.error(`Error fetching product ${productId}:`, err.message);
            return res.status(500).json({ error: 'Failed to retrieve product.' });
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

    if (!email || !email.includes('@')) { // Basic email validation
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const stmt = db.prepare("INSERT INTO newsletter_subscriptions (email) VALUES (?)");
    stmt.run(email, function(err) { // Use function() to access this.lastID
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'This email is already subscribed.' }); // 409 Conflict
            }
            console.error("Error subscribing to newsletter:", err.message);
            return res.status(500).json({ error: 'Failed to subscribe to newsletter.' });
        }
        console.log(`New newsletter subscription: ${email} (ID: ${this.lastID})`);
        res.status(201).json({ success: true, message: 'Successfully subscribed to the newsletter!', id: this.lastID });
    });
    stmt.finalize();
});

// --- Basic Route for the Frontend ---
// This ensures that your index.html is served for the root path.
// If you have client-side routing, you might need a catch-all route.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Error Handling Middleware (Basic) ---
// This should be defined after all other routes and middleware.
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.stack);
    res.status(500).send('Something broke on the server!');
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Serving static files from: ${path.join(__dirname, '/')}`);
    console.log('Press Ctrl+C to quit.');
});

// --- Graceful Shutdown (Optional but good practice) ---
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('SQLite database connection closed.');
        }
        process.exit(0);
    });
});
