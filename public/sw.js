// Service Worker para PWA
const CACHE_NAME = "profelink-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Estrategia network-first para HTML, cache-first para assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.status === 200 && (url.pathname.endsWith(".png") || url.pathname.endsWith(".jpg") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js") || url.pathname.endsWith(".woff2"))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});

// Notificaciones push
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: "ProfeLink", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "ProfeLink", {
      body: data.body || "",
      icon: "/logo-owl.png",
      badge: "/logo-owl.png",
      data: { url: data.url || "/" },
      tag: data.tag || "profelink-notif",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then(list => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
