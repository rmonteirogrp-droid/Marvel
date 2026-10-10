/* Service worker Marvel : l'app est gardée sur le téléphone ; images, vidéos et sons (/m/, /p/) sont gardés après le premier affichage.
   L'app s'ouvre depuis la copie gardée (instantané) ; la nouvelle version, récupérée en arrière-plan, sert à l'ouverture suivante. */
const CACHE = "marvel-02196e0cea5c";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icone-180.png", "./icone-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS.map(u => new Request(u, { cache:"reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k.startsWith("marvel-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request; if(r.method !== "GET") return;
  const u = new URL(r.url); if(u.origin !== self.location.origin) return;   // TMDB, Plex, YouTube : jamais en cache ici
  if(u.pathname.includes("/classique")) return;   // l'ancien design : toujours le réseau
  if(u.pathname.startsWith("/api/")) return;   // sauvegarde en ligne : jamais de cache
  if(r.mode === "navigate"){   // ouverture instantanée : la copie gardée tout de suite ; la dernière version est récupérée en arrière-plan pour la prochaine ouverture
    e.respondWith(caches.match("./index.html").then(x => {
      const reseau = fetch(r, { cache:"no-cache" }).then(rep => { if(rep.ok){ const c = rep.clone(); caches.open(CACHE).then(k => k.put("./index.html", c)); } return rep; });
      if(x){ e.waitUntil(reseau.then(() => {}, () => {})); return x; }
      return reseau.catch(() => fetch(r));
    }));
    return;
  }
  if(u.pathname.startsWith("/m/") || u.pathname.includes("/p/")){   // photos HD : gardées après le premier affichage (cache à part, conservé entre les versions)
    e.respondWith(caches.open("photos-hd").then(c => c.match(r).then(x => x || fetch(r).then(rep => { if(rep.ok) c.put(r, rep.clone()); return rep; }))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch:true }).then(x => x || fetch(r)));
});
