const CACHE_ASSETS = [
    "/",
    "./index.html",
    "./css/styles.css",
    "./js/index.js",
    "./icons/icon-192x192.png",
    "./icons/icon-144x144.png",
    "./icons/icon-72x72.png",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff2?v=4.7.0",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
    "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
    "./js/idb.js"
  ];

const APP_NAME = "BudgetTracker";
const APP_VERSION = "v1";
const CACHE_NAME = `${APP_NAME}-${APP_VERSION}`;

// installation process for service workers 
// Provide name of cache and files to be cached
self.addEventListener("install", function (e) {
    console.log("Cache Installed: " + CACHE_NAME)
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log("Caching Files")
            return cache.addAll(CACHE_ASSETS)
        })
    )
});
// activate
self.addEventListener("activate", function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            let cacheFiles = keyList.filter(function (key) {
                return key.indexOf(APP_NAME);
            });
            cacheFiles.push(CACHE_NAME);

            return Promise.all(
                keyList.map(function (key, i) {
                    if (cacheFiles.indexOf(key) === -1) {
                        console.log('Deleting cache: ' + keyList[i]);
                        return caches.delete(keyList[i]);
                    }
                })
            );
        })
    );
});

// fetch
self.addEventListener("fetch", function (e) {
    e.respondWith(
        caches.match(e.request).then(function (request) {
            if (request) {
                console.log('Responding with cache: ' + e.request.url);
                return request
            } else {
                console.log('File is not cached, fetching: ' + e.request.url);
                return fetch(e.request);
            }
        })
    )
});