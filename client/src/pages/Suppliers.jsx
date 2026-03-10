import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Suppliers() {
    const [search, setSearch] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/suppliers');
                setSuppliers(res.data);
            } catch (err) {
                console.error("Failed to fetch suppliers", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSuppliers();
    }, []);

    const filtered = suppliers.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="p-6 text-slate-500">Loading suppliers...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <p className="text-slate-400 text-sm">{filtered.length} suppliers</p>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search suppliers..."
                            className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 w-48 transition"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Supplier
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {['Supplier', 'Online Status', 'Rating', 'Delivery Time', 'Status', ''].map(h => (
                                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(s => (
                            <tr key={s._id} className="hover:bg-slate-50/60 transition">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sky-600 text-xs font-bold">{s.name.slice(0, 2).toUpperCase()}</span>
                                        </div>
                                        <span className="font-semibold text-slate-800">{s.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${s.productsOffered?.[0]?.isOnlineSupplier ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {s.productsOffered?.[0]?.isOnlineSupplier ? 'Online Platform' : 'Direct Distributor'}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-slate-700 font-medium">⭐ {s.rating}</td>
                                <td className="px-5 py-4 text-slate-700 font-medium">{s.deliveryDays} Days</td>
                                <td className="px-5 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200`}>
                                        Active
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <button className="text-xs text-sky-500 font-medium hover:underline cursor-pointer">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
