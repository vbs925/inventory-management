const express = require('express');
const router = express.Router();
const TrialBatch = require('../models/TrialBatch');
const InventoryItem = require('../models/InventoryItem');

// Get all trial batches
router.get('/', async (req, res) => {
    try {
        const trials = await TrialBatch.find().sort({ createdAt: -1 });
        res.json(trials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Log a new trial batch
router.post('/', async (req, res) => {
    try {
        const trial = new TrialBatch(req.body);
        const savedTrial = await trial.save();
        res.status(201).json(savedTrial);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update trial status (Approve / Reject)
router.put('/:id/status', async (req, res) => {
    try {
        const { status, feedbackNotes } = req.body;
        const trial = await TrialBatch.findById(req.params.id);
        if (!trial) return res.status(404).json({ message: 'Trial not found' });

        trial.status = status;
        if (feedbackNotes !== undefined) {
            trial.feedbackNotes = feedbackNotes;
        }

        const updatedTrial = await trial.save();
        res.json(updatedTrial);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
