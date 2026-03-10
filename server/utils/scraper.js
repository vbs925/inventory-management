const cheerio = require('cheerio');
const puppeteer = require('puppeteer-core');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
};

/**
 * Helper: extract a clean price number
 */
function parsePrice(str) {
    if (!str) return null;
    // Try to find an explicit currency symbol/acronym first
    const match = str.match(/(?:₹|rs\.?|mrp)\s?([\d,]+\.?\d*)/i);
    if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ''));
    }
    // Fallback old behavior
    const cleaned = str.replace(/[^\d.]/g, '');
    const fallbackMatch = cleaned.match(/\d+(\.\d{1,2})?/);
    return fallbackMatch ? parseFloat(fallbackMatch[0]) : null;
}

/**
 * Helper: fetch HTML using an existing Puppeteer browser instance.
 * Speeds up the process by blocking images, CSS, fonts.
 */
async function fetchHtml(browser, url) {
    const page = await browser.newPage();
    await page.setUserAgent(HEADERS['User-Agent']);
    await page.setExtraHTTPHeaders({'Accept-Language': 'en-US,en;q=0.9'});

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
        // Wait an extra second for React hydration
        await new Promise(r => setTimeout(r, 1000));
        const html = await page.content();
        await page.close();
        return html;
    } catch (err) {
        await page.close();
        throw err;
    }
}

// ──────────────────────────────────────────────────────────────
// 1. Apollo Pharmacy
// ──────────────────────────────────────────────────────────────
async function scrapeApolloPharmacy(query, browser) {
    try {
        const url = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(query)}`;
        const html = await fetchHtml(browser, url);
        const $ = cheerio.load(html);
        const results = [];

        $('.ProductCard_pdMain__2qcQf, [class*="ProductCard"]').each((i, el) => {
            if (i >= 5) return false;
            const name = $(el).find('.ProductCard_pdTitle__1hYd_, [class*="title"], h2, h3').first().text().trim();
            const priceStr = $(el).find('.ProductCard_pdPrice__2wB_G span, .ProductCard_priceGroup__O3LMB span, [class*="price"]').first().text();
            const href = $(el).closest('a').attr('href') || $(el).find('a').attr('href') || '';
            const price = parsePrice(priceStr);
            if (name && price) {
                results.push({
                    id: `apollo-${i}`,
                    name: 'Apollo Pharmacy',
                    rating: 4.8,
                    deliveryDays: 3,
                    price,
                    isOnline: true,
                    website: 'https://www.apollopharmacy.in',
                    url: href ? (href.startsWith('http') ? href : `https://www.apollopharmacy.in${href}`) : 'https://www.apollopharmacy.in'
                });
            }
        });
        return results;
    } catch (err) {
        console.error(`[Scraper] Apollo error: ${err.message}`);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// 2. Netmeds
// ──────────────────────────────────────────────────────────────
async function scrapeNetmeds(query, browser) {
    try {
        const url = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(query)}/all`;
        const html = await fetchHtml(browser, url);
        const $ = cheerio.load(html);
        const results = [];

        $('.ais-InfiniteHits-item, .item').each((i, el) => {
            if (i >= 4) return false;
            const name = $(el).find('.clsgetname, .info .name').text().trim();
            const priceStr = $(el).find('#final_price, .price').first().text().trim();
            const href = $(el).find('a').attr('href');
            const price = parsePrice(priceStr);
            if (name && price) {
                results.push({
                    id: `netmeds-${i}`,
                    name: 'Netmeds',
                    website: 'https://www.netmeds.com',
                    rating: 4.4,
                    deliveryDays: 5,
                    price,
                    isOnline: true,
                    url: href ? (href.startsWith('http') ? href : `https://www.netmeds.com${href}`) : url
                });
            }
        });
        return results;
    } catch (err) {
        console.error(`[Scraper] Netmeds error: ${err.message}`);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// 3. PharmEasy
// ──────────────────────────────────────────────────────────────
async function scrapePharmEasy(query, browser) {
    try {
        const url = `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`;
        const html = await fetchHtml(browser, url);
        const $ = cheerio.load(html);
        const results = [];

        const nextData = $('script#__NEXT_DATA__').html();
        if (nextData) {
            const json = JSON.parse(nextData);
            const products = json?.props?.pageProps?.searchResult?.products || [];
            products.slice(0, 5).forEach((p, i) => {
                const price = p.sellingPrice || p.mrp;
                if (p.name && price) {
                    results.push({
                            id: `pharmeasy-${i}`,
                            name: 'PharmEasy',
                            rating: 4.5,
                            deliveryDays: 3,
                            price: parseFloat((price / 100).toFixed(2)),
                            isOnline: true,
                            website: 'https://pharmeasy.in',
                            url: p.slug ? `https://pharmeasy.in/online-pharmacy/medicines/${p.slug}` : 'https://pharmeasy.in'
                    });
                }
            });
        }

        if (results.length === 0) {
            $('[class*="ProductCard"]').each((i, el) => {
                if (i >= 5) return false;
                const name = $(el).find('[class*="name"], [class*="title"]').first().text().trim();
                const priceStr = $(el).find('[class*="price"]').first().text();
                const href = $(el).find('a').attr('href') || '';
                const price = parsePrice(priceStr);
                if (name && price) {
                    results.push({
                        id: `pharmeasy-${i}`,
                        name: 'PharmEasy',
                        rating: 4.5,
                        deliveryDays: 3,
                        price,
                        isOnline: true,
                        website: 'https://pharmeasy.in',
                        url: href ? (href.startsWith('http') ? href : `https://pharmeasy.in${href}`) : 'https://pharmeasy.in'
                    });
                }
            });
        }
        return results;
    } catch (err) {
        console.error(`[Scraper] PharmEasy error: ${err.message}`);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// 4. 1mg
// ──────────────────────────────────────────────────────────────
async function scrape1mg(query, browser) {
    try {
        const url = `https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`;
        const html = await fetchHtml(browser, url);
        const $ = cheerio.load(html);
        const results = [];

        const nextData = $('script#__NEXT_DATA__').html();
        if (nextData) {
            try {
                const json = JSON.parse(nextData);
                const products = json?.props?.pageProps?.searchData?.data?.products || [];
                products.slice(0, 5).forEach((p, i) => {
                    const price = p.price || p.mrp;
                    if (p.name && price) {
                        results.push({
                            id: `1mg-${i}`,
                            name: '1mg',
                            rating: 4.6,
                            deliveryDays: 3,
                            price: parseFloat(parseFloat(price).toFixed(2)),
                            isOnline: true,
                            website: 'https://www.1mg.com',
                            url: p.url ? `https://www.1mg.com${p.url}` : 'https://www.1mg.com'
                        });
                    }
                });
            } catch(e) {}
        }

        if (results.length === 0) {
            $('[class*="style__product-card"]').each((i, el) => {
                if (i >= 5) return false;
                const name = $(el).find('[class*="name"]').first().text().trim();
                const priceStr = $(el).find('[class*="price"]').first().text();
                const href = $(el).find('a').attr('href') || '';
                const price = parsePrice(priceStr);
                if (name && price) {
                    results.push({
                        id: `1mg-${i}`,
                        name: '1mg',
                        rating: 4.6,
                        deliveryDays: 3,
                        price,
                        isOnline: true,
                        website: 'https://www.1mg.com',
                        url: href ? (href.startsWith('http') ? href : `https://www.1mg.com${href}`) : 'https://www.1mg.com'
                    });
                }
            });
        }
        return results;
    } catch (err) {
        console.error(`[Scraper] 1mg error: ${err.message}`);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// 5. MedPlus
// ──────────────────────────────────────────────────────────────
async function scrapeMedPlus(query, browser) {
    try {
        const url = `https://www.medplusmart.com/searchMedicines?s=${encodeURIComponent(query)}`;
        const html = await fetchHtml(browser, url);
        const $ = cheerio.load(html);
        const results = [];

        $('.product-info, [class*="ProductInfo"]').each((i, el) => {
            if (i >= 5) return false;
            const name = $(el).find('.product-name, h3, .name, [class*="name"]').first().text().trim();
            const priceStr = $(el).find('.product-price, .price, .selling-price, [class*="price"]').first().text();
            const href = $(el).closest('a').attr('href') || $(el).find('a').attr('href') || '';
            const price = parsePrice(priceStr);
            if (name && price) {
                results.push({
                    id: `medplus-${i}`,
                    name: 'MedPlus',
                    rating: 4.6,
                    deliveryDays: 4,
                    price,
                    isOnline: true,
                    website: 'https://www.medplusmart.com',
                    url: href ? (href.startsWith('http') ? href : `https://www.medplusmart.com${href}`) : 'https://www.medplusmart.com'
                });
            }
        });
        return results;
    } catch (err) {
        console.error(`[Scraper] MedPlus error: ${err.message}`);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// 6. Medikabazaar
// ──────────────────────────────────────────────────────────────
async function scrapeMedikabazaar(query, browser) {
    try {
        const url = `https://www.medikabazaar.com/catalogsearch/result/?q=${encodeURIComponent(query)}`;
        const html = await fetchHtml(browser, url);
        const $ = cheerio.load(html);
        const results = [];

        $('.product-item-info').each((i, el) => {
            if (i >= 5) return false;
            const name = $(el).find('.product-item-name').text().trim();
            const priceStr = $(el).find('.price').first().text();
            const href = $(el).find('a.product-item-link').attr('href') || '';
            const price = parsePrice(priceStr);
            if (name && price) {
                results.push({
                    id: `medikabazaar-${i}`,
                    name: 'Medikabazaar',
                    rating: 4.4,
                    deliveryDays: 4,
                    price,
                    isOnline: true,
                    website: 'https://www.medikabazaar.com',
                    url: href || 'https://www.medikabazaar.com'
                });
            }
        });
        return results;
    } catch (err) {
        console.error(`[Scraper] Medikabazaar error: ${err.message}`);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────
// Master scraper: runs all vendors in parallel using one shared Browser
// ──────────────────────────────────────────────────────────────
async function scrapeAllVendors(query) {
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: true,
            args: [
                '--headless=new',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1280,800'
            ]
        });

        const settled = await Promise.allSettled([
            scrapeApolloPharmacy(query, browser),
            scrapeNetmeds(query, browser),
            scrapePharmEasy(query, browser),
            scrape1mg(query, browser),
            scrapeMedPlus(query, browser),
            scrapeMedikabazaar(query, browser),
        ]);

        const all = [];
        settled.forEach(result => {
            if (result.status === 'fulfilled') all.push(...result.value);
        });

        // Deduplicate: keep only the single best (lowest price) result per vendor
        const bestByVendor = new Map();
        all.forEach(item => {
            const existing = bestByVendor.get(item.name);
            if (!existing || item.price < existing.price) {
                bestByVendor.set(item.name, item);
            }
        });

        await browser.close();

        const liveResults = Array.from(bestByVendor.values());
        console.log(`[Scraper] Puppeteer live results: ${liveResults.length} vendors responded for "${query}"`);
        return liveResults;

    } catch (err) {
        if (browser) await browser.close();
        console.error('[Scraper] Puppeteer critical error:', err);
        return [];
    }
}

module.exports = {
    scrapeAllVendors
};
