const mongoose = require('mongoose');

const trialBatchSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
    },
    supplierName: { // Stored redundantly for faster UI queries
        type: String,
        required: true,
    },
    quantityOrdered: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    dateReceived: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'In Evaluation', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    feedbackNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TrialBatch', trialBatchSchema);
