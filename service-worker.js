self.addEventListener("install", event => {
  console.log("Service Worker installé");

  // Liste des fichiers à mettre en cache
  const cacheFiles = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
  ];

  // Mettre en cache pendant l'installation
  event.waitUntil(
    caches.open('my-cache-v1').then(cache => {
      console.log('Fichiers en cache');
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener("fetch", event => {
  // Récupérer la ressource du cache si l'utilisateur est hors ligne
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request); // Cherche la ressource, sinon utilise le cache
    })
  );
});