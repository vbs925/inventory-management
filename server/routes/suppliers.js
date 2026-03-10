const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { scrapeAllVendors } = require('../utils/scraper');

// Get all suppliers
router.get('/', async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Pure Live Search — scrapes all vendors in real-time
// Returns a sorted list of suppliers with real prices for any medicine query
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || !query.trim()) return res.json([]);

        console.log(`[Search] Live searching all vendors for: "${query}"`);

        // Scrape all vendors concurrently in real-time
        const liveResults = await scrapeAllVendors(query);

        if (liveResults.length === 0) {
            // Return a structured empty result so the frontend still shows the product name
            return res.json([{ productName: query, suppliers: [] }]);
        }

        // Filter out any rejected trial suppliers
        const TrialBatch = require('../models/TrialBatch');
        const allRejectedTrials = await TrialBatch.find({ status: 'Rejected' });

        const validResults = liveResults.filter(sup => {
            return !allRejectedTrials.some(
                trial => trial.itemName.toLowerCase() === query.toLowerCase()
                    && trial.supplierName === sup.name
            );
        });

        // Sort by lowest price first (best deal at top)
        validResults.sort((a, b) => a.price - b.price);

        // Return in the format the frontend expects
        res.json([{
            productName: query,
            suppliers: validResults
        }]);

    } catch (error) {
        console.error('[Search] Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
