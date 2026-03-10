import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5001/api/orders';
const socket = io('http://localhost:5001');

const statusBadge = {
    pending: 'bg-sky-50 text-sky-700 border-sky-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};
const statusLabel = { pending: 'Pending', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(API_URL);
                setOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();

        // Listen for new orders
        socket.on('order-added', (newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
        });

        return () => {
            socket.off('order-added');
        };
    }, []);

    const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter.toLowerCase());

    return (
        <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <p className="text-slate-400 text-sm">{filtered.length} orders</p>
                <div className="flex items-center gap-2">
                    {['All', 'Pending', 'Delivered', 'Cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer
                ${filter === f ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {f}
                        </button>
                    ))}
                    <button
                        onClick={() => alert('New Bulk Orders can currently only be initiated through the Trial Batch approval process on the Recommendations page. Please go there to search for items, log a trial batch, and approve it before creating a bulk Purchase Order.')}
                        className="flex items-center gap-2 ml-2 px-4 py-2 bg-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-400 transition cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Order (Restricted)
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {['Order ID', 'Supplier', 'Items', 'Total', 'Date', 'Status'].map(h => (
                                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">Loading orders...</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-slate-400">No orders found.</td>
                            </tr>
                        ) : filtered.map(o => (
                            <tr key={o._id || o.id} className="hover:bg-slate-50/60 transition">
                                <td className="px-5 py-4 font-semibold text-slate-800">{o.orderId || o.id}</td>
                                <td className="px-5 py-4 text-slate-600">{o.supplierName || o.supplier}</td>
                                <td className="px-5 py-4 text-slate-600">
                                    {o.itemName ? `${o.quantity}x ${o.itemName}` : `${o.items} items`}
                                </td>
                                <td className="px-5 py-4 font-semibold text-slate-800">
                                    {o.totalPrice !== undefined ? `₹${o.totalPrice.toFixed(2)}` : o.total}
                                </td>
                                <td className="px-5 py-4 text-slate-500">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : o.date}
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusBadge[o.status]}`}>
                                        {statusLabel[o.status] || o.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
