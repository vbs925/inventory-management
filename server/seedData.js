/**
 * seedData.js
 * Seeds vendor metadata into the database on server startup IF no vendors exist yet.
 * Products are NOT pre-seeded — the search is fully live via web scraping.
 */

const Supplier = require('./models/Supplier');
const InventoryItem = require('./models/InventoryItem');

// ─── Real Indian Online Pharma Vendors ───────────────────────────────────────
const realVendors = [
    { name: "Apollo Pharmacy", isOnline: true, rating: 4.8, deliveryDays: 3, website: "https://www.apollopharmacy.in" },
    { name: "MedPlus", isOnline: true, rating: 4.6, deliveryDays: 4, website: "https://www.medplusmart.com" },
    { name: "PharmEasy", isOnline: true, rating: 4.5, deliveryDays: 3, website: "https://www.pharmeasy.in" },
    { name: "Netmeds", isOnline: true, rating: 4.4, deliveryDays: 5, website: "https://www.netmeds.com" },
    { name: "1mg", isOnline: true, rating: 4.6, deliveryDays: 3, website: "https://www.1mg.com" },
    { name: "Wellness Forever", isOnline: true, rating: 4.3, deliveryDays: 6, website: "https://www.wellnessforever.com" },
    { name: "Medline India", isOnline: true, rating: 4.4, deliveryDays: 4, website: "https://www.medlineindia.com" },
    { name: "Medikabazaar", isOnline: true, rating: 4.4, deliveryDays: 4, website: "https://www.medikabazaar.com" },
    { name: "Dentalmart", isOnline: true, rating: 4.4, deliveryDays: 4, website: "https://www.dentalmart.com" },
    { name: "Deal32", isOnline: true, rating: 4.4, deliveryDays: 4, website: "https://www.deal32.com" },
];

// ─── Core Seed Function ────────────────────────────────────────────────────────
async function runSeed() {
    console.log('[AutoSeed] Upserting vendor metadata...');

    // Use upsert — never wipe existing data
    const ops = realVendors.map(v => ({
        updateOne: {
            filter: { name: v.name },
            update: {
                $setOnInsert: {
                    name: v.name,
                    rating: v.rating,
                    deliveryDays: v.deliveryDays,
                    website: v.website,
                    isOnline: v.isOnline,
                    productsOffered: [],
                }
            },
            upsert: true
        }
    }));

    await Supplier.bulkWrite(ops);
    console.log(`[AutoSeed] Done — ${realVendors.length} vendors ensured in DB (live-search only mode).`);
}

/**
 * Call this after mongoose.connect() in server.js.
 * Only seeds if no vendors exist (safe to call on every restart).
 */
async function runSeedIfEmpty() {
    try {
        const count = await Supplier.countDocuments();
        if (count === 0) {
            await runSeed();
        } else {
            console.log(`[AutoSeed] Skipping — ${count} vendors already in database.`);
        }
    } catch (err) {
        console.error('[AutoSeed] Seed error:', err.message);
    }
}

module.exports = { runSeedIfEmpty, runSeed };
