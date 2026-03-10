const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 1. Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Create a new order (Enforces Trial Batch Policy)
router.post('/', async (req, res) => {
    try {
        const { itemName, supplierName, quantity, totalPrice, status } = req.body;

        // --- NEW POLICY: ENFORCE APPROVED TRIAL BATCH FOR OUT-OF-STOCK ITEMS ---
        const InventoryItem = require('../models/InventoryItem');
        const inventoryItem = await InventoryItem.findOne({ name: itemName });
        const currentStock = inventoryItem ? inventoryItem.stock : 0;

        let approvedTrial = null;
        if (currentStock === 0) {
            const TrialBatch = require('../models/TrialBatch');
            approvedTrial = await TrialBatch.findOne({
                itemName: itemName,
                supplierName: supplierName,
                status: 'Approved'
            });

            if (!approvedTrial) {
                return res.status(403).json({
                    message: `Order rejected. '${itemName}' is completely Out of Stock (or new). The Doctor requires a Trial Batch from '${supplierName}' to be approved before bulk ordering.`
                });
            }
        }
        // ------------------------------------------------

        // Generate a random Order ID like ORD-0049
        const count = await Order.countDocuments();
        const orderId = `ORD-${String(count + 1).padStart(4, '0')}`;

        const newOrder = new Order({
            orderId,
            supplierName,
            itemName,
            quantity,
            totalPrice,
            status: status || 'delivered'
        });

        const savedOrder = await newOrder.save();

        if (approvedTrial) {
            approvedTrial.status = 'Completed';
            await approvedTrial.save();
        }

        // Emit real-time event
        req.io.emit('order-added', savedOrder);

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
