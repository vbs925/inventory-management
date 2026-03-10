const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');

// Note: The io instance will be attached to the request object (req.io) in server.js

// 1. Get all inventory items
router.get('/', async (req, res) => {
    try {
        const items = await InventoryItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Add a new item
router.post('/', async (req, res) => {
    try {
        const newItem = new InventoryItem(req.body);
        const savedItem = await newItem.save();

        // Emit real-time event
        req.io.emit('item-added', savedItem);

        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 3. Update an item
router.put('/:id', async (req, res) => {
    try {
        // Find item and update fields
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        Object.assign(item, req.body);
        const updatedItem = await item.save(); // Triggers the pre-save hook to recalc status

        // Emit real-time event
        req.io.emit('item-updated', updatedItem);

        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 4. Delete an item
router.delete('/:id', async (req, res) => {
    try {
        const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ message: 'Item not found' });

        // Emit real-time event
        req.io.emit('item-deleted', req.params.id);

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4.5 Consume (Decrement) an item's stock
router.put('/:id/consume', async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: "Invalid consumption quantity" });
        }

        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Prevent negative stock
        if (item.stock < quantity) {
            return res.status(400).json({ message: `Cannot consume ${quantity}. Only ${item.stock} left in stock.` });
        }

        item.stock -= quantity;
        const updatedItem = await item.save(); // triggers pre-save hook for status updates

        // Emit general item-updated event, plus a specific consume event for the dashboard
        req.io.emit('item-updated', updatedItem);
        req.io.emit('stock-consumed', {
            item: updatedItem.name,
            quantity: quantity,
            timestamp: new Date()
        });

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Get Recommendations (POC)
router.get('/recommendations', async (req, res) => {
    try {
        // a. Find low stock items
        const lowStockItems = await InventoryItem.find({
            $expr: { $lte: ['$stock', '$reorder'] }
        });

        if (lowStockItems.length === 0) {
            return res.json([]);
        }

        const Supplier = require('../models/Supplier');
        const TrialBatch = require('../models/TrialBatch');
        const { scrapeAllVendors } = require('../utils/scraper');

        const allSuppliers = await Supplier.find();
        const allRejectedTrials = await TrialBatch.find({ status: 'Rejected' });

        // Spin up live scraper tasks concurrently for all low-stock items
        // This makes sure we get live prices for items that need reordering
        const liveScrapePromises = lowStockItems.map(item => scrapeAllVendors(item.name).catch(() => []));
        const liveScrapeResults = await Promise.all(liveScrapePromises);

        const recommendations = lowStockItems.map((item, index) => {
            const itemLiveResults = liveScrapeResults[index] || [];

            // Find valid database suppliers that haven't been rejected
            const validSuppliers = allSuppliers.filter(s => {
                const offersProduct = s.productsOffered.some(p => p.name.toLowerCase() === item.name.toLowerCase());
                if (!offersProduct) return false;

                const isRejected = allRejectedTrials.some(
                    trial => trial.itemName.toLowerCase() === item.name.toLowerCase() && trial.supplierName === s.name
                );
                return !isRejected;
            });

            // Convert database suppliers to the scoring format
            const scoredSuppliers = validSuppliers.map(s => {
                const product = s.productsOffered.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                const score = (s.rating * 20) - (product.currentPrice) - (s.deliveryDays * 2);
                return {
                    id: s._id,
                    name: s.name,
                    rating: s.rating,
                    price: product.currentPrice,
                    isOnline: product.isOnlineSupplier || false,
                    url: product.url || null,
                    deliveryDays: s.deliveryDays,
                    score: Math.round(score)
                };
            });

            // Add the newly fetched live scrapers to the scoring list
            itemLiveResults.forEach(liveSupplier => {
                // Same simple scoring algorithm
                const score = (liveSupplier.rating * 20) - (liveSupplier.price) - (liveSupplier.deliveryDays * 2);
                liveSupplier.score = Math.round(score);
                scoredSuppliers.push(liveSupplier);
            });

            // Sort suppliers highest score first
            scoredSuppliers.sort((a, b) => b.score - a.score);

            const deficit = item.reorder - item.stock;
            const suggestedOrderQuantity = Math.max(deficit, Math.ceil(item.reorder * 1.5));

            return {
                item: {
                    id: item._id,
                    name: item.name,
                    category: item.category,
                    stock: item.stock,
                    reorder: item.reorder,
                    unit: item.unit
                },
                suggestedQuantity: suggestedOrderQuantity,
                suppliers: scoredSuppliers
            };
        });

        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
