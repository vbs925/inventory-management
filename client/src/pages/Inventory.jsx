import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5001/api/inventory';
let socket;

const categories = ['All', 'Analgesics', 'Antibiotics', 'Surgical Supplies', 'IV Fluids', 'PPE', 'Antidiabetics', 'Antacids'];

const statusBadge = {
    'in-stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'low-stock': 'bg-amber-50 text-amber-700 border-amber-200',
    'out-of-stock': 'bg-red-50 text-red-700 border-red-200',
};
const statusLabel = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
};

const defaultForm = { name: '', category: '', stock: '', unit: '', reorder: '', expiry: '' };

export default function Inventory() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch initial data and setup Socket.IO
    useEffect(() => {
        // Fetch data via REST API
        axios.get(API_URL)
            .then(res => {
                setItems(res.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch inventory:", err);
                setIsLoading(false);
            });

        // Initialize Socket.io connection to backend
        socket = io('http://localhost:5001');

        // Socket Event: Item Added
        socket.on('item-added', (newItem) => {
            setItems(prev => [newItem, ...prev]);
        });

        // Socket Event: Item Updated
        socket.on('item-updated', (updatedItem) => {
            setItems(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
        });

        // Socket Event: Item Deleted
        socket.on('item-deleted', (deletedId) => {
            setItems(prev => prev.filter(item => item._id !== deletedId));
        });

        // Cleanup on unmount
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const filtered = items.filter(it => {
        const matchSearch = it.name.toLowerCase().includes(search.toLowerCase()) || it.category.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === 'All' || it.category === catFilter;
        const matchStatus = statusFilter === 'All' || it.status === statusFilter;
        return matchSearch && matchCat && matchStatus;
    });

    // 2. Add Item (sends to backend)
    async function handleAddItem(e) {
        e.preventDefault();
        try {
            // Backend automatically calculates the `status` based on stock vs reorder
            await axios.post(API_URL, {
                name: form.name,
                category: form.category,
                stock: form.stock === '' ? 0 : parseInt(form.stock),
                unit: form.unit,
                reorder: form.reorder === '' ? 0 : parseInt(form.reorder),
                expiry: form.expiry,
            });
            // We don't manually setItems() here because the Socket.io 'item-added' event will handle it for ALL clients (including us)
            setForm(defaultForm);
            setShowModal(false);
        } catch (err) {
            console.error("Failed to add item:", err);
            alert("Error adding item. Is the backend running?");
        }
    }

    // 3. Delete Item
    async function handleDelete(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                // Socket.io 'item-deleted' event handles the UI update
            } catch (err) {
                console.error("Failed to delete item:", err);
            }
        }
    }

    // 4. Consume Item Stock
    async function handleConsume(item) {
        const qtyStr = prompt(`How many units of ${item.name} were used?`);
        if (!qtyStr) return;

        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) {
            alert('Please enter a valid positive number.');
            return;
        }

        if (qty > item.stock) {
            alert(`Cannot consume ${qty} units. Only ${item.stock} remaining in stock!`);
            return;
        }

        try {
            await axios.put(`${API_URL}/${item._id}/consume`, { quantity: qty });
            // Socket object handles the state sync
        } catch (err) {
            console.error("Failed to consume item:", err);
            alert(err.response?.data?.message || "Failed to log consumption.");
        }
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <p className="text-slate-400 text-sm">
                        {isLoading ? "Loading..." : `${filtered.length} of ${items.length} items`}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            type="text" placeholder="Search items..."
                            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 w-44 transition"
                        />
                    </div>
                    {/* Category filter */}
                    <select
                        value={catFilter} onChange={e => setCatFilter(e.target.value)}
                        className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition cursor-pointer"
                    >
                        {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {/* Status filter */}
                    <select
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="in-stock">In Stock</option>
                        <option value="low-stock">Low Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                    </select>
                    {/* Add button */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3.5 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Loading inventory...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No items found.</td></tr>
                            ) : filtered.map((row) => (
                                <tr key={row._id} className="hover:bg-slate-50/60 transition">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                            </div>
                                            <span className="text-slate-800 font-medium">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500">{row.category}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`font-semibold ${row.stock === 0 ? 'text-red-500' : row.stock < row.reorder ? 'text-amber-600' : 'text-slate-800'}`}>
                                            {row.stock}
                                        </span>
                                        <span className="text-slate-400 text-xs ml-1">/ {row.reorder} min</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500">{row.unit}</td>
                                    <td className="px-5 py-3.5 text-slate-500">{row.expiry || 'N/A'}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusBadge[row.status]}`}>
                                            {statusLabel[row.status]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {(row.status === 'low-stock' || row.status === 'out-of-stock') && (
                                                <button
                                                    onClick={() => navigate('/recommendations')}
                                                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-sm animate-pulse hover:animate-none"
                                                    title="Find best supplier for this item"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    Reorder
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleConsume(row)}
                                                className="text-xs font-medium text-amber-600 hover:text-amber-800 cursor-pointer bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 transition"
                                                title="Log Daily Usage"
                                            >
                                                Consume
                                            </button>
                                            <button
                                                onClick={() => handleDelete(row._id)}
                                                className="text-slate-400 hover:text-red-500 transition cursor-pointer px-1"
                                                title="Delete Item Entirely"
                                            >
                                                <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Item Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-slate-800 font-semibold text-base">Add New Inventory Item</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-3.5">
                            {[
                                { label: 'Item Name', field: 'name', type: 'text', placeholder: 'e.g. Paracetamol 500mg' },
                                { label: 'Category', field: 'category', type: 'text', placeholder: 'e.g. Analgesics' },
                                { label: 'Current Stock', field: 'stock', type: 'number', placeholder: '0' },
                                { label: 'Unit', field: 'unit', type: 'text', placeholder: 'e.g. Tablets, Boxes' },
                                { label: 'Reorder Level', field: 'reorder', type: 'number', placeholder: '0' },
                                { label: 'Expiry Date', field: 'expiry', type: 'date', placeholder: '' },
                            ].map(f => (
                                <div key={f.field}>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                                    <input
                                        required={f.field !== 'expiry'}
                                        type={f.type}
                                        placeholder={f.placeholder}
                                        value={form[f.field]}
                                        onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition cursor-pointer">
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
