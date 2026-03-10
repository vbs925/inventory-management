const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    unit: {
        type: String,
        required: true,
    },
    reorder: {
        type: Number,
        required: true,
        min: 0,
    },
    expiry: {
        type: String, // Store as YYYY-MM-DD string for simplicity
        default: '',
    },
    status: {
        type: String,
        enum: ['in-stock', 'low-stock', 'out-of-stock'],
        default: 'in-stock',
    },
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Middleware to auto-calculate status before saving
inventoryItemSchema.pre('save', function () {
    if (this.stock === 0) {
        this.status = 'out-of-stock';
    } else if (this.stock < this.reorder) {
        this.status = 'low-stock';
    } else {
        this.status = 'in-stock';
    }
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
