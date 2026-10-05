/* Service worker Marvel : l'app (un seul fichier de ~38 Mo) est gardée sur le téléphone.
   Ouverture instantanée, même sans réseau ; chaque nouveau déploiement est installé en arrière-plan. */
const CACHE = "marvel-e4c8e3de9305";
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
  if(r.mode === "navigate"){ e.respondWith(caches.match("./index.html").then(x => x || fetch(r))); return; }
  if(u.pathname.includes("/p/")){   // photos HD : gardées après le premier affichage (cache à part, conservé entre les versions)
    e.respondWith(caches.open("photos-hd").then(c => c.match(r).then(x => x || fetch(r).then(rep => { if(rep.ok) c.put(r, rep.clone()); return rep; }))));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch:true }).then(x => x || fetch(r)));
});
