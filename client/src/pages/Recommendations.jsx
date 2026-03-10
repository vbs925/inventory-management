import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/inventory/recommendations';
const SUPPLIERS_SEED_URL = 'http://localhost:5001/api/suppliers/seed';

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Global Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const SEARCH_URL = 'http://localhost:5001/api/suppliers/search';
    const INVENTORY_API_URL = 'http://localhost:5001/api/inventory';
    const TRIALS_API_URL = 'http://localhost:5001/api/trials';

    const [trials, setTrials] = useState([]);
    const [isTrialsLoading, setIsTrialsLoading] = useState(true);

    const fetchRecommendations = () => {
        setIsLoading(true);
        axios.get(API_URL)
            .then(res => {
                setRecommendations(res.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch recommendations:", err);
                setIsLoading(false);
            });
    };

    const fetchTrials = () => {
        setIsTrialsLoading(true);
        axios.get(TRIALS_API_URL)
            .then(res => {
                setTrials(res.data);
                setIsTrialsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch trials:", err);
                setIsTrialsLoading(false);
            });
    };

    useEffect(() => {
        fetchRecommendations();
        fetchTrials();
    }, []);

    const seedSuppliers = async () => {
        try {
            if (confirm('This will wipe existing suppliers and generate fresh mock data for the POC. Continue?')) {
                await axios.post(SUPPLIERS_SEED_URL);
                alert('Suppliers seeded successfully. Refreshing recommendations...');
                fetchRecommendations();
            }
        } catch (err) {
            alert('Error seeding suppliers');
            console.error(err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await axios.get(`${SEARCH_URL}?q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error("Failed to search suppliers:", err);
            alert("Error searching suppliers.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleLogTrial = async (productName, supplier) => {
        const qtyStr = prompt(`How many units of ${productName} would you like to trial from ${supplier.name}?`, "5");
        if (!qtyStr || isNaN(qtyStr)) return;

        try {
            await axios.post(TRIALS_API_URL, {
                itemName: productName,
                supplierId: supplier.id,
                supplierName: supplier.name,
                quantityOrdered: parseInt(qtyStr),
                unitPrice: supplier.price
            });
            alert(`Trial batch logged for ${productName} from ${supplier.name}!`);
            fetchTrials();
        } catch (err) {
            console.error("Failed to log trial:", err);
            alert("Error logging trial batch.");
        }
    };

    const handleUpdateTrial = async (trialId, status) => {
        try {
            await axios.put(`${TRIALS_API_URL}/${trialId}/status`, { status });
            fetchTrials();
        } catch (err) {
            alert("Error updating trial status");
        }
    };

    const handleAddToInventory = async (productName, initialStock = 0) => {
        const reorderStr = prompt(`Set minimum Reorder Level for ${productName}:`, "10");
        if (reorderStr === null) return; // User cancelled

        try {
            await axios.post(INVENTORY_API_URL, {
                name: productName,
                category: "General",
                stock: initialStock,
                unit: "Units",
                reorder: parseInt(reorderStr) || 0,
                expiry: ""
            });
            alert(`${productName} added to inventory with ${initialStock} starting units!`);
            fetchRecommendations(); // Refresh the low-stock dashboard
            setSearchResults([]); // Hide search results cleanly
            setSearchQuery('');
        } catch (err) {
            console.error("Failed to add to inventory:", err);
            alert("Error adding item to inventory.");
        }
    };

    const handleCreatePO = async (item, suggestedQuantity, supplierName, unitPrice) => {
        if (!confirm(`Create Purchase Order for ${suggestedQuantity} units of ${item.name} from ${supplierName}?`)) return;

        try {
            // Update the inventory item's stock in the database
            await axios.put(`${INVENTORY_API_URL}/${item.id}`, {
                stock: item.stock + suggestedQuantity
            });

            // Log the official Order
            await axios.post('http://localhost:5001/api/orders', {
                supplierName: supplierName,
                itemName: item.name,
                quantity: suggestedQuantity,
                totalPrice: unitPrice * suggestedQuantity,
                status: 'delivered'
            });

            alert(`PO sent to ${supplierName}. Inventory updated with +${suggestedQuantity} ${item.unit}!`);
            fetchRecommendations(); // Refresh list to remove the item if it's now fully stocked
        } catch (err) {
            console.error("Failed to create PO:", err);
            // Show specific trial batch rejection message
            if (err.response && err.response.status === 403) {
                alert(err.response.data.message);
            } else {
                alert("Error creating Purchase Order and restocking inventory.");
            }
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Restock Recommendations</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Items currently at or below their set Reorder Level.
                    </p>
                </div>
                <button
                    onClick={seedSuppliers}
                    className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                    [POC] Regenerate Mock Suppliers
                </button>
            </div>

            {/* Global Search Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Global Medical Supply Search</h3>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search all vendor catalogs (e.g. Ibuprofen, Syringes)..."
                        className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                    <button type="submit" disabled={isSearching} className="px-6 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition disabled:opacity-50 cursor-pointer">
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {searchResults.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Price Comparison Results</h4>
                        {searchResults.map((result, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-lg text-slate-800">{result.productName}</h4>
                                    <button
                                        onClick={() => handleAddToInventory(result.productName)}
                                        className="px-4 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 transition shadow-sm cursor-pointer"
                                    >
                                        + Track in Main Inventory
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {result.suppliers.map((sup, sIdx) => {
                                        const isBestPrice = sIdx === 0;
                                        return (
                                            <div key={sup.id} className={`p-4 rounded-xl border relative transition ${isBestPrice ? 'border-emerald-500 bg-emerald-50/30 shadow-sm ring-1 ring-emerald-500' : 'border-slate-200 bg-slate-50'}`}>
                                                {isBestPrice && (
                                                    <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                                                        Lowest Price
                                                    </span>
                                                )}
                                                <div className="flex justify-between items-start mb-2 mt-1">
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 text-sm leading-tight">{sup.name}</h5>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${sup.isOnline ? 'text-indigo-500' : 'text-slate-500'}`}>
                                                            {sup.isOnline ? 'Online Vendor' : 'Local Vendor'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                                                        <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="text-xs font-bold text-amber-700">{sup.rating.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <div className="my-3 py-2 border-y border-slate-200/60 flex justify-between items-baseline">
                                                    <span className="text-xs text-slate-500">Unit Price</span>
                                                    <span className={`text-lg font-bold ${isBestPrice ? 'text-emerald-600' : 'text-slate-800'}`}>₹{sup.price.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                                                    <span>Delivery</span>
                                                    <span className="font-semibold text-slate-700">{sup.deliveryDays === 0 ? 'Same Day' : `${sup.deliveryDays} Days`}</span>
                                                </div>

                                                <button
                                                    onClick={() => handleLogTrial(result.productName, sup)}
                                                    className="w-full py-1.5 text-xs font-semibold rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                                                >
                                                    Log Trial Batch
                                                </button>
                                                {(sup.url || sup.website) && (
                                                    <a
                                                        href={sup.url || sup.website}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        Visit Site
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Trial Batches Tracker */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Procurement Intelligence: Trial Batches</h3>
                    <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">Evaluation Board</span>
                </div>

                {isTrialsLoading ? (
                    <div className="flex justify-center py-4 text-slate-400 text-sm">Loading trials...</div>
                ) : trials.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No active trial batches. Search for items above and log a trial.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3 font-medium">Item & Vendor</th>
                                    <th className="pb-3 font-medium">Quantity & Price</th>
                                    <th className="pb-3 font-medium">Date Logged</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {trials.map(trial => (
                                    <tr key={trial._id} className="text-sm">
                                        <td className="py-4">
                                            <p className="font-bold text-slate-800">{trial.itemName}</p>
                                            <p className="text-slate-500 text-xs">{trial.supplierName}</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-semibold text-slate-700">{trial.quantityOrdered} Units</p>
                                            <p className="text-slate-500 text-xs">₹{trial.unitPrice.toFixed(2)} / ea</p>
                                        </td>
                                        <td className="py-4 text-slate-500">
                                            {new Date(trial.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${trial.status === 'Pending' ? 'bg-slate-100 text-slate-600' :
                                                trial.status === 'In Evaluation' ? 'bg-amber-100 text-amber-700' :
                                                    trial.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                                                        trial.status === 'Completed' ? 'bg-sky-100 text-sky-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                {trial.status}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right space-x-2">
                                            {trial.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateTrial(trial._id, 'Approved')} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 cursor-pointer bg-emerald-50 px-2 py-1 rounded inline-block mr-2">✓ Approve</button>
                                                    <button onClick={() => handleUpdateTrial(trial._id, 'Rejected')} className="text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer bg-red-50 px-2 py-1 rounded inline-block">✗ Reject</button>
                                                </>
                                            )}
                                            {trial.status === 'In Evaluation' && (
                                                <>
                                                    <button onClick={() => handleUpdateTrial(trial._id, 'Approved')} className="text-xs font-medium text-emerald-600 hover:text-emerald-800 cursor-pointer bg-emerald-50 px-2 py-1 rounded inline-block mr-2">✓ Approve</button>
                                                    <button onClick={() => handleUpdateTrial(trial._id, 'Rejected')} className="text-xs font-medium text-red-600 hover:text-red-800 cursor-pointer bg-red-50 px-2 py-1 rounded inline-block">✗ Reject</button>
                                                </>
                                            )}
                                            {trial.status === 'Approved' && (
                                                <button onClick={() => handleAddToInventory(trial.itemName, trial.quantityOrdered)} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 cursor-pointer px-3 py-1.5 rounded-lg shadow-sm transition">
                                                    + Main Inventory
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : recommendations.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-emerald-800 font-bold text-lg mb-2">Inventory is Healthy!</h3>
                    <p className="text-emerald-600/80 text-sm max-w-sm mx-auto">
                        All your items are currently above their respective reorder minimums. No procurement recommendations at this time.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {recommendations.map((rec) => (
                        <div key={rec.item.id} className="bg-white border text-left border-red-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-red-50 px-6 py-4 flex items-center justify-between border-b border-red-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-red-900 font-bold text-lg">{rec.item.name}</h3>
                                        <p className="text-red-700/80 text-sm">
                                            Current Stock: <span className="font-bold text-red-700">{rec.item.stock}</span> {rec.item.unit} &nbsp;|&nbsp; Minimum: <span className="font-bold">{rec.item.reorder}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-red-600 font-medium uppercase tracking-wider mb-1">Recommended Order</p>
                                    <p className="text-xl font-bold text-red-900">{rec.suggestedQuantity} <span className="text-sm font-normal text-red-700">{rec.item.unit}</span></p>
                                </div>
                            </div>

                            <div className="p-6">
                                <h4 className="text-sm font-semibold text-slate-800 mb-4">Supplier Options</h4>

                                {rec.suppliers.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No suppliers found carrying this item.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {rec.suppliers.map((sup, idx) => {
                                            const isBestMatch = idx === 0;
                                            return (
                                                <div key={sup.id} className={`p-4 rounded-xl border relative transition ${isBestMatch ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
                                                    {isBestMatch && (
                                                        <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                                                            Lowest Price Match
                                                        </span>
                                                    )}
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h5 className="font-bold text-slate-800 text-sm leading-tight pr-2">{sup.name}</h5>
                                                        <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                                                            <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            <span className="text-[10px] font-bold text-amber-700">{sup.rating.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${sup.isOnline ? 'text-indigo-500' : 'text-slate-500'}`}>
                                                        {sup.isOnline ? 'Online' : 'Local'}
                                                    </span>

                                                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 text-sm">
                                                        <div className="flex justify-between items-baseline text-slate-600">
                                                            <span className="text-xs">Unit Price:</span>
                                                            <span className={`font-bold text-base ${isBestMatch ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                                ₹{sup.price.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-slate-600">
                                                            <span className="text-xs">Est. Delivery:</span>
                                                            <span className="font-semibold text-xs">{sup.deliveryDays === 0 ? 'Same Day' : `${sup.deliveryDays} Days`}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 mt-4">
                                                        <button
                                                            onClick={() => handleLogTrial(rec.item.name, sup)}
                                                            className="flex-1 px-2 py-2 text-xs font-semibold rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                                                        >
                                                            Request Trial
                                                        </button>
                                                        <button
                                                            onClick={() => handleCreatePO(rec.item, rec.suggestedQuantity, sup.name, sup.price)}
                                                            className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg transition cursor-pointer ${isBestMatch ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            Bulk PO ({rec.suggestedQuantity})
                                                        </button>
                                                    </div>
                                                    {(sup.url || sup.website) && (
                                                        <a
                                                            href={sup.url || sup.website}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            Visit Site
                                                        </a>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
