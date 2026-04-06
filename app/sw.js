/**
 * DEVIENS SOMMELIER — Service Worker (MINDFUL Blueprint)
 * 
 * Strategy: Cache-First with Network Update (Stale-While-Revalidate)
 * - Serves cached content instantly for speed
 * - Fetches fresh content in background
 * - Auto-updates cache and notifies user when new version is available
 * 
 * IMPORTANT: Increment CACHE_VERSION to bust cache on deploy
 */

const CACHE_VERSION = 'dsm-v5.2';
const CACHE_NAME = `dsm-cache-${CACHE_VERSION}`;

// Core app shell files to precache
const PRECACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './auth.js',
    './app.js',
    './quiz_generator.js',
    './ai_concierge.js',
    './dashboard.js',
    './quest.js',
    './users_meta.js',
    './manifest.json',
    './assets/img/app_icon_192.png',
    './assets/img/app_icon_512.png'
];

// URLs that should NEVER be cached (API endpoints, GAS)
const NEVER_CACHE = [
    'script.google.com',
    'generativelanguage.googleapis.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// ========== INSTALL ==========
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing ${CACHE_VERSION}`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())  // Activate immediately
    );
});

// ========== ACTIVATE ==========
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating ${CACHE_VERSION}`);
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key.startsWith('dsm-cache-') && key !== CACHE_NAME)
                    .map(key => {
                        console.log(`[SW] Purging old cache: ${key}`);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())  // Take control immediately
    );
});

// ========== FETCH ==========
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Never cache API calls
    if (NEVER_CACHE.some(domain => url.hostname.includes(domain))) return;

    // For navigation requests, always try network first (to get latest HTML)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Stale-While-Revalidate for other resources
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                // Update cache with fresh response
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);  // If network fails, fall back to cache

            return cached || fetchPromise;
        })
    );
});

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
