const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// GET /api/settings - Fetch the single clinic settings doc
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // If settings don't exist yet, create default
        if (!settings) {
            settings = await Settings.create({});
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/settings - Update the settings doc
router.put('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings(req.body);
            await settings.save();
            return res.json(settings);
        }

        Object.assign(settings, req.body);
        const updatedSettings = await settings.save();

        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
