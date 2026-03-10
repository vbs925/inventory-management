import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const navItems = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 10a2 2 0 012-2h4a2 2 0 012 2v.5a2 2 0 01-2 2H5a2 2 0 01-2-2V17zm10-10a2 2 0 012-2h4a2 2 0 012 2v.5a2 2 0 01-2 2h-4a2 2 0 01-2-2V7zm0 10a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
            </svg>
        ),
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
    },
    {
        id: 'orders',
        label: 'Orders',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        id: 'suppliers',
        label: 'Suppliers',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        id: 'recommendations',
        label: 'Recommendations',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export default function Sidebar({ activePage, setActivePage }) {
    return (
        <aside className="w-64 min-h-screen bg-slate-900 flex flex-col flex-shrink-0">
            {/* Logo */}
            <div className="flex flex-col items-center px-4 py-5 border-b border-slate-700/50 gap-2">
                <div className="bg-white rounded-xl p-2 w-36 flex items-center justify-center">
                    <img
                        src={logo}
                        alt="Clinic Logo"
                        className="w-full h-auto object-contain"
                    />
                </div>
                <p className="text-slate-100 text-sm font-semibold tracking-wide">Clinic Inventory</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mb-3">Main Menu</p>
                {navItems.slice(0, 4).map((item) => (
                    <Link
                        key={item.id}
                        to={item.id === 'dashboard' ? '/' : `/${item.id}`}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
              ${activePage === item.id
                                ? 'bg-sky-500 text-white shadow-sm'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}

                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mt-6 mb-3 pt-2">Analytics</p>
                {navItems.slice(4).map((item) => (
                    <Link
                        key={item.id}
                        to={`/${item.id}`}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
              ${activePage === item.id
                                ? 'bg-sky-500 text-white shadow-sm'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* User */}
            <div className="px-3 py-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800">
                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">DR</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">Dr. Riya Mehta</p>
                        <p className="text-slate-400 text-xs truncate">Administrator</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
