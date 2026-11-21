import { createFileRoute } from "@tanstack/react-router";

const SNIPPET = `<script>
  // TankiSol install bridge: show the install prompt when opened from the store
  let deferred;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; });
  if (new URLSearchParams(location.search).get("tankisol_install") === "1") {
    window.addEventListener("click", () => deferred && deferred.prompt(), { once: true });
  }
</script>`;

export const Route = createFileRoute("/bridge")({
  head: () => ({
    meta: [
      { title: "Install bridge docs — TankiSol Appstore" },
      { name: "description", content: "Add the TankiSol install bridge to your PWA for one-tap installs." },
      { property: "og:title", content: "Install bridge docs — TankiSol Appstore" },
      { property: "og:description", content: "Add the TankiSol install bridge to your PWA for one-tap installs." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl font-bold">Install bridge</h1>
      <p className="text-muted-foreground">Paste this snippet into your app so users arriving from TankiSol get a one-tap install prompt.</p>
      <pre className="overflow-x-auto rounded-xl bg-charcoal p-4 text-xs text-charcoal-foreground">{SNIPPET}</pre>
    </div>
  ),
});
