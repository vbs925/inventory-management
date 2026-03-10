import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/settings';

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        axios.get(API_URL)
            .then(res => {
                setSettings(res.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load settings:", err);
                setIsLoading(false);
            });
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(API_URL, settings);
            alert("Settings saved successfully!");
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Error saving settings.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !settings) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    return (
        <div className="p-6 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {/* Profile */}
                <div className="p-6">
                    <h3 className="text-slate-800 font-semibold text-sm mb-4">Clinic Profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Clinic Name</label>
                            <input name="clinicName" value={settings.clinicName} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                            <input name="location" value={settings.location} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Admin Name</label>
                            <input name="adminName" value={settings.adminName} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Contact Email</label>
                            <input name="contactEmail" value={settings.contactEmail} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition" />
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="mt-4 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition cursor-pointer disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Threshold */}
                <div className="p-6">
                    <h3 className="text-slate-800 font-semibold text-sm mb-1">Low Stock Threshold</h3>
                    <p className="text-slate-400 text-xs mb-4">Items will be flagged as "Low Stock" when their quantity falls below this percentage of the reorder level.</p>
                    <div className="flex items-center gap-3">
                        <input name="lowStockThreshold" type="range" min="5" max="50" value={settings.lowStockThreshold} onChange={handleChange} className="w-48 accent-sky-500 cursor-pointer" />
                        <span className="text-slate-700 text-sm font-semibold">{settings.lowStockThreshold}%</span>
                    </div>
                </div>

                {/* Notifications */}
                <div className="p-6">
                    <div className="p-6">
                        <h3 className="text-slate-800 font-semibold text-sm mb-4">Notification Preferences</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Email alerts for low stock', key: 'emailAlertsLowStock' },
                                { label: 'Notifications for expiring items (30 days)', key: 'notifyExpiring' },
                                { label: 'Daily inventory summary', key: 'dailySummary' },
                                { label: 'Purchase order status updates', key: 'poUpdates' },
                            ].map(f => (
                                <div key={f.key} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600">{f.label}</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input name={f.key} checked={settings[f.key]} onChange={handleChange} type="checkbox" className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-sky-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
