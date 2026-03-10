const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    supplierName: {
        type: String,
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'cancelled'],
        default: 'delivered', // For the POC, we assume immediate restock = delivered
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
