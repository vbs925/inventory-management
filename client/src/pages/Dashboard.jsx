import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5001/api/dashboard/stats';
const socket = io('http://localhost:5001');

const statusConfig = {
    completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    warning: { label: 'Low Stock', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    pending: { label: 'Pending', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    danger: { label: 'Removed', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalItems: 0, lowStock: 0, ordersToday: 0, expiringSoon: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [quickStats, setQuickStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get(API_URL);
            setStats(res.data.stats);
            setRecentActivity(res.data.recentActivity);
            setQuickStats(res.data.quickStats);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        const refresh = () => fetchDashboardData();
        socket.on('item-added', refresh);
        socket.on('item-updated', refresh);
        socket.on('item-deleted', refresh);
        socket.on('order-added', refresh);
        socket.on('trial-updated', refresh);

        return () => {
            socket.off('item-added', refresh);
            socket.off('item-updated', refresh);
            socket.off('item-deleted', refresh);
            socket.off('order-added', refresh);
            socket.off('trial-updated', refresh);
        };
    }, []);

    // Helper map for static dashboard cards based on live numbers
    const statCards = [
        {
            label: 'Total Items',
            value: stats.totalItems,
            change: 'Live tracking',
            changeUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'bg-sky-50 text-sky-600',
            accent: 'bg-sky-500',
        },
        {
            label: 'Low Stock',
            value: stats.lowStock,
            change: stats.lowStock > 0 ? 'Requires action' : 'All good',
            changeUp: stats.lowStock === 0,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: 'bg-amber-50 text-amber-600',
            accent: 'bg-amber-500',
        },
        {
            label: 'Orders Today',
            value: stats.ordersToday,
            change: 'Last 24 hours',
            changeUp: true,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            color: 'bg-emerald-50 text-emerald-600',
            accent: 'bg-emerald-500',
        },
        {
            label: 'Expiring Soon',
            value: stats.expiringSoon,
            change: 'Within 30 days',
            changeUp: stats.expiringSoon === 0,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'bg-red-50 text-red-600',
            accent: 'bg-red-500',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((s, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                            {s.icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-slate-500 text-xs font-medium">{s.label}</p>
                            <p className="text-slate-900 text-2xl font-bold mt-0.5">{s.value}</p>
                            <p className={`text-xs mt-1 font-medium ${s.changeUp ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {s.change}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-slate-800 font-semibold text-sm">Recent Activity</h3>
                        <button className="text-xs text-sky-500 font-medium hover:underline cursor-pointer">View all</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentActivity.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-slate-400">No recent activity found.</div>
                        ) : recentActivity.map((row, i) => {
                            const s = statusConfig[row.status] || statusConfig.completed;
                            return (
                                <div key={i} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            {row.type === 'order' ? (
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : row.type === 'low_stock' ? (
                                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-slate-800 text-sm font-medium truncate">{row.item}</p>
                                            <p className="text-slate-400 text-xs">{row.action} · {row.qty}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>
                                        <span className="text-xs text-slate-400 w-[5rem] text-right">{row.time}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Overview */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-slate-800 font-semibold text-sm">Stock by Category</h3>
                    </div>
                    <div className="px-5 py-4 space-y-5">
                        {quickStats.length === 0 ? (
                            <div className="text-center text-sm text-slate-400">No stock categorised yet.</div>
                        ) : quickStats.map((q, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm text-slate-700 font-medium">{q.label}</span>
                                    <span className="text-xs text-slate-400">{q.count} items</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${q.pct < 20 ? 'bg-red-500' : q.pct < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, Math.max(5, q.pct))}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{q.pct}% required stock filled</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="px-5 py-4 border-t border-slate-100 space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
                        <button
                            onClick={() => navigate('/inventory')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Item
                        </button>
                        <button
                            onClick={() => navigate('/orders')}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Create Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
