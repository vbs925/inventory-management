import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5001/api/inventory';
const SOCKET_URL = 'http://localhost:5001';

export default function Reports() {
    const [stats, setStats] = useState({
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    const calculateStats = (inventory) => {
        let total = inventory.length;
        let low = 0;
        let out = 0;
        // In a real app we'd have a unit price on the inventory, but for the POC we'll mock an average ₹500 value per item type for the total value calculation.
        let val = inventory.length * 500;

        inventory.forEach(item => {
            if (item.stock === 0) out++;
            else if (item.stock <= item.reorder) low++;
        });

        setStats({
            totalItems: total,
            lowStock: low,
            outOfStock: out,
            totalValue: `₹ ${val.toLocaleString()}`
        });
    };

    const fetchInventoryData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(API_URL);
            calculateStats(res.data);
        } catch (err) {
            console.error("Failed to fetch inventory for reports:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventoryData();

        const socket = io(SOCKET_URL);

        // Listen for any inventory changes to refresh stats in real-time
        socket.on('item-added', fetchInventoryData);
        socket.on('item-updated', fetchInventoryData);
        socket.on('item-deleted', fetchInventoryData);

        return () => {
            socket.disconnect();
        };
    }, []);

    const reportCards = [
        { title: 'Total Managed Items', value: stats.totalItems, note: 'Unique product SKUs', color: 'text-indigo-600' },
        { title: 'Low Stock Alerts', value: stats.lowStock, note: 'Needs attention soon', color: 'text-amber-500' },
        { title: 'Currently Out of Stock', value: stats.outOfStock, note: 'Action required immediately', color: 'text-red-600' },
        { title: 'Estimated Value', value: stats.totalValue, note: 'Projected capital bound', color: 'text-emerald-600' },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Inventory Status Reports</h2>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-600">Real-time sync active</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {reportCards.map((c, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{c.title}</p>
                            <p className={`text-3xl font-bold mt-2 ${c.color}`}>{c.value}</p>
                            <p className="text-slate-400 text-xs mt-2">{c.note}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mb-4 ring-8 ring-sky-50/50">
                    <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-2">Detailed Analytics Coming Soon</h3>
                <p className="text-slate-500 text-sm max-w-md">Historical charts, usage forecasting, and downloadable CSV audit reports will be available in the next release. The overview cards above are automatically calculating your current database state.</p>
                <button className="mt-6 px-5 py-2.5 bg-sky-500 text-white text-sm font-semibold rounded-lg hover:bg-sky-600 transition shadow-sm cursor-pointer disabled:opacity-50" disabled>
                    Export Summary PDF
                </button>
            </div>
        </div>
    );
}
