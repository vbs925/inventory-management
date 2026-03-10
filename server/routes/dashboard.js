const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const Order = require('../models/Order');
const TrialBatch = require('../models/TrialBatch');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // Parallel fetch for speed
        const [items, orders, trials] = await Promise.all([
            InventoryItem.find(),
            Order.find().sort({ createdAt: -1 }).limit(10), // Get recent 10 orders
            TrialBatch.find().sort({ createdAt: -1 }).limit(5)
        ]);

        // 1. Calculate top-level stats
        const totalItemsCount = items.length;
        const lowStockCount = items.filter(i => i.stock < i.reorder).length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ordersTodayCount = orders.filter(o => new Date(o.createdAt) >= today).length;

        // Simplistic logic: an item is 'expiring soon' if its expiry string exists and is < 30 days out.
        // For POC, we'll just count items that have an expiry field to simulate it.
        const expiringSoonCount = items.filter(i => i.expiry && i.expiry !== '').length;

        // 2. Build Recent Activity Feed
        let recentActivity = [];

        // Add low stock alerts as activity
        items.filter(i => i.stock < i.reorder).slice(0, 3).forEach(i => {
            recentActivity.push({
                type: 'low_stock',
                item: i.name,
                action: 'Low Stock Alert',
                qty: `${i.stock} units left`,
                time: new Date(i.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'warning',
                timestamp: i.updatedAt
            });
        });

        // Add recent orders
        orders.slice(0, 5).forEach(o => {
            recentActivity.push({
                type: 'order',
                item: o.itemName,
                action: 'PO Created',
                qty: `${o.quantity} units`,
                time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'completed',
                timestamp: o.createdAt
            });
        });

        // Add recent trials
        trials.forEach(t => {
            let action = t.status === 'Approved' ? 'Trial Approved' : 'Trial Logged';
            recentActivity.push({
                type: 'trial',
                item: t.itemName,
                action: action,
                qty: `${t.quantityOrdered} units`,
                time: new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: t.status === 'Approved' ? 'completed' : 'pending',
                timestamp: t.createdAt
            });
        });

        // Sort combined activity by chronological timestamp desc
        recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        recentActivity = recentActivity.slice(0, 6); // Keep top 6 for the UI

        // 3. Category Math (Quick Stats)
        const categories = {};
        items.forEach(i => {
            if (!categories[i.category]) {
                categories[i.category] = { count: 0, stock: 0, required: 0 };
            }
            categories[i.category].count++;
            categories[i.category].stock += i.stock;
            categories[i.category].required += (i.reorder || 1);
        });

        const quickStats = Object.keys(categories).map(cat => {
            const data = categories[cat];
            // Simple stock health percentage for POC
            let pct = Math.min(100, Math.round((data.stock / Math.max(1, data.required)) * 100));
            return {
                label: cat,
                count: data.count,
                pct: pct
            };
        });

        res.json({
            stats: {
                totalItems: totalItemsCount,
                lowStock: lowStockCount,
                ordersToday: ordersTodayCount,
                expiringSoon: expiringSoonCount
            },
            recentActivity,
            quickStats
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
