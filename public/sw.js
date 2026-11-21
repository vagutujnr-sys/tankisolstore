const CACHE_NAME = "tankisol-shell-v1";
const APP_SHELL_URL = new URL("/", self.location.origin).href;
const OFFLINE_URL = new URL("/offline.html", self.location.origin).href;
const STATIC_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/appicon.png",
];

async function offlineResponse(cache) {
  const cachedPage = await cache.match(OFFLINE_URL);
  if (cachedPage) {
    return new Response(await cachedPage.text(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(
    "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>You're offline</title><p>Reconnect to the internet and try again.</p></html>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function offlineNavigationResponse(cache, url) {
  if (url.pathname !== "/" || url.search) return offlineResponse(cache);

  const cachedShell = await cache.match(APP_SHELL_URL);
  if (!cachedShell) return offlineResponse(cache);

  const html = await cachedShell.text();
  const staticHtml = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(
      /(<body\b[^>]*>)/i,
      '$1<div role="status" style="background:#303840;color:#fff;padding:12px 16px;text-align:center">You are offline. Showing the last saved home page; live data and links may be unavailable.</div>',
    );
  return new Response(staticHtml, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(STATIC_URLS);
        try {
          const response = await fetch(APP_SHELL_URL, { cache: "no-cache" });
          if (response.ok) await cache.put(APP_SHELL_URL, response);
        } catch (error) {
          console.warn("TankiSol offline home page could not be cached during install", error);
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("tankisol-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) return;

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const value of event.data.urls) {
        const url = new URL(value, self.location.origin);
        const isAppResource =
          url.origin === self.location.origin &&
          (url.pathname === "/" ||
            url.pathname.startsWith("/assets/") ||
            url.pathname.startsWith("/icons/") ||
            url.pathname === "/manifest.webmanifest");
        if (!isAppResource) continue;

        try {
          const response = await fetch(url.href, { cache: "no-cache" });
          if (response.ok) await cache.put(url.href, response);
        } catch (error) {
          console.warn("TankiSol offline resource could not be cached", url.pathname, error);
        }
      }
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        if (self.navigator.onLine === false) return offlineNavigationResponse(cache, url);

        try {
          const response = await fetch(request);
          if (url.pathname === "/" && !url.search && response.ok) {
            await cache.put(APP_SHELL_URL, response.clone());
          }
          return response;
        } catch {
          return offlineNavigationResponse(cache, url);
        }
      })(),
    );
    return;
  }

  const isStaticResource =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";
  if (!isStaticResource) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }),
  );
});
