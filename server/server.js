require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const { runSeedIfEmpty } = require('./seedData');

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Enable CORS for React frontend
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Make io accessible in our routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Setup Socket.io connections
io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});

// Routes
const inventoryRoutes = require('./routes/inventory');
const suppliersRoutes = require('./routes/suppliers');
const trialsRoutes = require('./routes/trials');
const ordersRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/trials', trialsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('The server is running!!');
});

// Connect Database & Start Server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('[MongoDB] Successfully connected to Atlas.');
        server.listen(PORT, async () => {
            console.log(`[Server] Express running on http://localhost:${PORT}`);
            // Auto-seed real Indian vendors & medicines if the DB is empty
            await runSeedIfEmpty();
        });
    })
    .catch((err) => {
        console.error('[MongoDB] Connection error:', err.message);
        console.warn('\n⚠️ WARNING: You must update the MONGODB_URI in server/.env with your actual Atlas connection string.');
    });
