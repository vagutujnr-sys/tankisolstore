import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();

export function registerPwaServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  void navigator.serviceWorker
    .register("/sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      const cacheAppResources = () => {
        const controller = navigator.serviceWorker.controller;
        if (!controller) return;

        const resources = performance
          .getEntriesByType("resource")
          .map(({ name }) => new URL(name, location.href))
          .filter(
            (url) =>
              url.origin === location.origin &&
              (url.pathname.startsWith("/assets/") ||
                url.pathname.startsWith("/icons/") ||
                url.pathname === "/manifest.webmanifest"),
          )
          .map((url) => url.href);

        controller.postMessage({ type: "CACHE_URLS", urls: ["/", ...resources] });
      };

      if (navigator.serviceWorker.controller) {
        cacheAppResources();
      } else {
        navigator.serviceWorker.addEventListener("controllerchange", cacheAppResources, {
          once: true,
        });
      }
    })
    .catch((error) => console.error("TankiSol service worker registration failed", error));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Captures TankiSol's own beforeinstallprompt so we can offer "Install TankiSol". */
export function useStoreInstall() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const update = () => {
      setCanPrompt(!!deferred);
      setInstalled(isStandalone());
    };
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  async function prompt() {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    setCanPrompt(false);
    return outcome;
  }
  return { canPrompt, installed, prompt };
}
