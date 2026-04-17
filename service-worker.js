const CACHE_NAME = 'cvd-corrector';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/webcam.js',
    './js/renderer.js',
    './js/shaders.js',
    './manifest.json'
];

// 1. Install Event: Simpan semua file ke dalam Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('Opened cache');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Event: Bersihkan cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch Event: Ambil dari Cache dulu, jika tidak ada baru ambil dari Jaringan
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            // Jika file ada di cache, kembalikan file tersebut
            if (response) {
                return response;
            }
            // Jika tidak ada, ambil dari jaringan/internet
            return fetch(event.request);
        })
    );
});