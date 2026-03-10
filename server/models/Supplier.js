const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    productsOffered: [{
        name: { type: String, required: true }, // 'Paracetamol 500mg'
        sku: { type: String }, // e.g. 'PRC-500'
        currentPrice: { type: Number, required: true }, // Absolute numeric price
        isOnlineSupplier: { type: Boolean, default: false }, // Tag for Dentalkart vs Local
        url: { type: String } // Link to external product page if online
    }],
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    // We can keep priceMultiplier as an overall aggregated metric, but per-product prices take precedence
    priceMultiplier: {
        type: Number,
        required: true,
    },
    deliveryDays: {
        type: Number, // e.g., 2 = 2 days delivery
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
