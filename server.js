// server.js
// Updated with User Authentication (Registration, Login, JWT)

// --- Dependencies ---
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JWT session management
const cookieParser = require('cookie-parser'); // To parse cookies

// --- Configuration ---
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-and-secret-key-12345'; // IMPORTANT: Use an environment variable in production!
const JWT_EXPIRES_IN = '1h'; // Token expiration time (e.g., 1 hour, 7d for 7 days)

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Setup ---
const dataDir = process.env.RENDER_DATA_DIR || __dirname;
const dbPath = path.join(dataDir, 'database.sqlite');

console.log(`SQLite Database Path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

// Function to initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users Table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL, -- Will store hashed password
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating users table:', err.message);
            else console.log('Users table checked/created successfully.');
        });

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
            if (err) console.error('Error creating products table:', err.message);
            else {
                console.log('Products table checked/created successfully.');
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
            if (err) console.error('Error creating newsletter_subscriptions table:', err.message);
            else console.log('Newsletter subscriptions table checked/created successfully.');
        });
    });
}

// Function to seed initial product data (same as before)
function seedProducts() {
    const sampleProducts = [
        { name: "Smartphone Alpha", category: "Mobile Phones", price: 799.99, imageUrl: "https://placehold.co/300x300/E0E0E0/B0B0B0?text=Smartphone", description: "Next-gen smartphone with AI features.", badge: "New", stock: 50 },
        { name: "Laptop UltraSlim", category: "Laptops", price: 1250.00, imageUrl: "https://placehold.co/300x300/D8D8D8/A8A8A8?text=Laptop", description: "Lightweight and powerful for on-the-go productivity.", badge: "Sale", stock: 30 },
        { name: "AudioBliss Headphones", category: "Audio", price: 249.50, imageUrl: "https://placehold.co/300x300/E8E8E8/B8B8B8?text=Headphones", description: "Immersive sound with active noise cancellation.", badge: null, stock: 75 },
    ];
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) { console.error("Error checking product count:", err.message); return; }
        if (row.count === 0) {
            console.log("Seeding initial products...");
            const stmt = db.prepare("INSERT INTO products (name, category, price, imageUrl, description, badge, stock) VALUES (?, ?, ?, ?, ?, ?, ?)");
            sampleProducts.forEach(p => stmt.run(p.name, p.category, p.price, p.imageUrl, p.description, p.badge, p.stock));
            stmt.finalize(err => {
                if (err) console.error("Error seeding products:", err.message);
                else console.log("Initial products seeded.");
            });
        } else {
            console.log("Products table already has data. Skipping seed.");
        }
    });
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Middleware to parse cookies

// Serve static files
app.use(express.static(path.join(__dirname, '/')));


// --- Authentication API Routes ---

// POST: Register a new user
app.post('/api/users/register', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: 'All fields (fullName, email, password) are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        // Check if user already exists
        db.get("SELECT email FROM users WHERE email = ?", [email.toLowerCase()], async (err, row) => {
            if (err) {
                console.error("DB error checking user:", err.message);
                return res.status(500).json({ error: 'Server error during registration.' });
            }
            if (row) {
                return res.status(409).json({ error: 'User with this email already exists.' }); // 409 Conflict
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10

            // Insert new user into the database
            const stmt = db.prepare("INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)");
            stmt.run(fullName, email.toLowerCase(), hashedPassword, function (err) {
                if (err) {
                    console.error("DB error inserting user:", err.message);
                    return res.status(500).json({ error: 'Failed to register user.' });
                }
                console.log(`New user registered: ${email} (ID: ${this.lastID})`);
                res.status(201).json({ success: true, message: 'User registered successfully. Please log in.', userId: this.lastID });
            });
            stmt.finalize();
        });
    } catch (error) {
        console.error("Registration process error:", error);
        res.status(500).json({ error: 'Server error during registration process.' });
    }
});

// POST: Login an existing user
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email.toLowerCase()], async (err, user) => {
        if (err) {
            console.error("DB error finding user:", err.message);
            return res.status(500).json({ error: 'Server error during login.' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' }); // Unauthorized
        }

        // Compare submitted password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' }); // Unauthorized
        }

        // User matched, create JWT
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
                // Add other non-sensitive info if needed
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }, (err, token) => {
            if (err) {
                console.error("Error signing JWT:", err);
                return res.status(500).json({ error: 'Failed to generate login token.' });
            }

            // Send token in an HTTP-only cookie (more secure against XSS)
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
                maxAge: parseInt(JWT_EXPIRES_IN) * 1000, // e.g., 1 hour in milliseconds
                sameSite: 'strict' // Or 'lax' depending on your needs
            });

            console.log(`User logged in: ${user.email}`);
            res.json({
                success: true,
                message: 'Login successful!',
                user: { id: user.id, email: user.email, fullName: user.fullName }
                // Optionally send the token in response body too if needed by client, but cookie is preferred for web
                // token: token
            });
        });
    });
});

// POST: Logout user (clears the cookie)
app.post('/api/users/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0), // Set cookie to expire immediately
        sameSite: 'strict'
    });
    res.json({ success: true, message: 'Logged out successfully.' });
});

// GET: Check authentication status (example protected route or utility)
// This middleware would typically be applied to routes that require authentication
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user; // Add user payload to request object
        next();
    } catch (ex) {
        console.error("Token verification failed:", ex.message);
        res.status(401).json({ error: 'Not authenticated. Token is invalid or expired.' });
    }
};

app.get('/api/users/authcheck', authMiddleware, (req, res) => {
    // If authMiddleware passes, req.user will be populated
    res.json({
        success: true,
        isAuthenticated: true,
        user: req.user
    });
});


// --- Other API Routes (Products, Newsletter - same as before) ---
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products ORDER BY category, name", [], (err, rows) => {
        if (err) { res.status(500).json({ error: 'Failed to retrieve products.' }); return; }
        res.json(rows);
    });
});
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid product ID.' });
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to retrieve product.' });
        if (row) res.json(row);
        else res.status(404).json({ error: 'Product not found.' });
    });
});
app.post('/api/newsletter/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required.' });
    const stmt = db.prepare("INSERT INTO newsletter_subscriptions (email) VALUES (?)");
    stmt.run(email.toLowerCase(), function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) return res.status(409).json({ message: 'Email already subscribed.' });
            return res.status(500).json({ error: 'Subscription failed.' });
        }
        res.status(201).json({ success: true, message: 'Subscribed!', id: this.lastID });
    });
    stmt.finalize();
});

// --- Frontend Routes ---
// Serve index.html for root and auth pages explicitly
app.get(['/', '/index.html', '/login.html', '/register.html'], (req, res) => {
    const page = req.path === '/' ? 'index.html' : req.path.substring(1);
    res.sendFile(path.join(__dirname, page));
});

// Catch-all for other GET requests - serves index.html (for SPA-like behavior if needed)
// Ensure this is AFTER specific static file routes and API routes.
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) { // Don't serve index.html for API routes
        return next();
    }
    // Check if the request is for a known static asset type to avoid serving index.html for them
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
        return next(); // Let express.static handle it or 404
    }
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err && !res.headersSent) {
            res.status(500).send("Error serving the application.");
        }
    });
});


// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("Unhandled application error:", err.stack);
    if (!res.headersSent) {
        res.status(500).send('An unexpected error occurred on the server!');
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} (or your Render URL)`);
});

// --- Graceful Shutdown ---
function gracefulShutdown() {
    console.log('Attempting graceful shutdown...');
    db.close((err) => {
        if (err) console.error('Error closing SQLite database:', err.message);
        else console.log('SQLite database connection closed.');
        console.log('Server shut down.');
        process.exit(0);
    });
}
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
