import React, { useState } from 'react';

const pageTitles = {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    orders: 'Purchase Orders',
    suppliers: 'Suppliers',
    recommendations: 'Smart Restock',
    reports: 'Reports',
    settings: 'Settings',
};

export default function Navbar({ activePage }) {
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
            {/* Left */}
            <div>
                <h2 className="text-slate-800 font-semibold text-lg">{pageTitles[activePage]}</h2>
                <p className="text-slate-400 text-xs">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 w-52 transition"
                    />
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                    >
                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                    {notifOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">Notifications</span>
                                <span className="text-xs text-sky-500 font-medium cursor-pointer hover:underline">Mark all read</span>
                            </div>
                            {[
                                { msg: '3 items are below minimum stock level', time: '5m ago', color: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
                                { msg: 'Order #ORD-0042 has been delivered', time: '1h ago', color: 'bg-green-50 border-green-200', dot: 'bg-green-400' },
                                { msg: 'Paracetamol 500mg expires in 14 days', time: '3h ago', color: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
                            ].map((n, i) => (
                                <div key={i} className={`px - 4 py - 3 border - b border - slate - 50 hover: bg - slate - 50 cursor - pointer transition`}>
                                    <div className="flex items-start gap-2.5">
                                        <span className={`mt - 1.5 w - 2 h - 2 rounded - full flex - shrink - 0 ${n.dot} `}></span>
                                        <div>
                                            <p className="text-xs text-slate-700 leading-snug">{n.msg}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="px-4 py-2.5 text-center">
                                <span className="text-xs text-sky-500 font-medium cursor-pointer hover:underline">View all notifications</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 cursor-pointer">
                    <span className="text-white text-xs font-semibold">DR</span>
                </div>
            </div>
        </header>
    );
}
