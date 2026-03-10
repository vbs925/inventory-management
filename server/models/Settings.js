const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const settingsSchema = new Schema({
    clinicName: { type: String, default: 'City Care Clinic' },
    location: { type: String, default: 'Mumbai, Maharashtra' },
    adminName: { type: String, default: 'Dr. Riya Mehta' },
    contactEmail: { type: String, default: 'admin@citycare.in' },
    lowStockThreshold: { type: Number, default: 20 },
    emailAlertsLowStock: { type: Boolean, default: true },
    notifyExpiring: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: true },
    poUpdates: { type: Boolean, default: true }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
