import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Download, ExternalLink, Heart, Flag, Globe, Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { appBySlugQuery, screenshotsQuery } from "@/lib/apps";
import { AppScreenshot } from "@/components/store/AppScreenshot";
import { AppIcon } from "@/components/store/AppIcon";
import { InstallDialog } from "@/components/store/InstallDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markLibrary, trackInstallEvent } from "@/lib/install";

export const Route = createFileRoute("/apps/$slug")({
  loader: async ({ context, params }) => {
    const app = await context.queryClient.ensureQueryData(appBySlugQuery(params.slug));
    if (!app) throw notFound();
    return { name: app.name, desc: app.short_description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} — TankiSol Appstore` : "App — TankiSol" },
      { name: "description", content: loaderData?.desc ?? "App on TankiSol." },
      { property: "og:title", content: loaderData ? `${loaderData.name} on TankiSol` : "TankiSol app" },
      { property: "og:description", content: loaderData?.desc ?? "App on TankiSol." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppDetails,
});

function AppDetails() {
  const { slug } = Route.useParams();
  const { data: app } = useSuspenseQuery(appBySlugQuery(slug));
  const { user } = useAuth();
  const qc = useQueryClient();
  const [installOpen, setInstallOpen] = useState(false);
  const { data: shots, error: shotsError } = useQuery({ ...screenshotsQuery(app?.id ?? ""), enabled: !!app });
  const { data: lib } = useQuery({
    queryKey: ["library-item", app?.id, user?.id],
    enabled: !!user && !!app,
    queryFn: async () => { if (!app || !user) return null; return (await supabase.from("user_app_library").select("*").eq("application_id", app.id).eq("user_id", user.id).maybeSingle()).data; },
  });

  useEffect(() => {
    if (app && app.status === "published") supabase.from("application_views").insert({ application_id: app.id }).then(() => {});
  }, [app?.id]);

  if (!app) return null;

  function open() {
    if (!app) return;
    trackInstallEvent(app.id, "app_opened");
    markLibrary(app.id, "added", true);
    window.open(app.app_url, "_blank", "noopener");
  }

  async function toggleFav() {
    if (!app) return;
    if (!user) { toast("Sign in to save favourites"); return; }
    await supabase.from("user_app_library").upsert(
      { user_id: user.id, application_id: app.id, is_favourite: !lib?.is_favourite },
      { onConflict: "user_id,application_id" },
    );
    qc.invalidateQueries({ queryKey: ["library-item"] });
    qc.invalidateQueries({ queryKey: ["library"] });
  }

  async function report() {
    if (!app) return;
    if (!user) { toast("Sign in to report an app"); return; }
    const reason = window.prompt("What's wrong with this app?");
    if (!reason || reason.trim().length < 3) return;
    const { error } = await supabase.from("application_reports").insert({ application_id: app.id, user_id: user.id, reason: reason.trim().slice(0, 1000) });
    toast(error ? "Couldn't send report" : "Thanks — our team will review it.");
  }

  const host = new URL(app.app_url).host;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Back</Link>


      <div className="flex gap-4">
        <AppIcon name={app.name} src={app.icon_url} className="size-20 text-3xl sm:size-24" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{app.name}</h1>
          <p className="flex items-center gap-1 text-sm font-medium text-primary">
            {app.developer?.name}
            {app.developer?.is_verified && <BadgeCheck className="size-4" aria-label="Verified developer" />}
          </p>
          <p className="text-xs text-muted-foreground">{app.category?.name} · v{app.version} · {app.is_free ? "Free" : "Paid"}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Button size="lg" onClick={() => { trackInstallEvent(app.id, "install_click"); setInstallOpen(true); }}>
          <Download /> Install app
        </Button>
        <Button size="lg" variant="outline" onClick={open}><ExternalLink /> Open app</Button>
        <Button size="lg" variant="outline" aria-label="Favourite" onClick={toggleFav}>
          <Heart className={lib?.is_favourite ? "fill-primary text-primary" : ""} />
        </Button>
      </div>
      {lib && (
        <p className="text-xs text-muted-foreground">
          In My Apps · {lib.install_state === "confirmed" ? "Installed (confirmed by you)" : lib.install_state === "requested" ? "Install started" : "Added"}
        </p>
      )}

      {shots && shots.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          {shots.map((s) => <AppScreenshot key={s.id} src={s.url} alt={`${app.name} screenshot`} className="h-72 rounded-lg border object-cover" />)}
        </div>
      )}
      {shotsError && <p role="alert" className="text-sm text-destructive">Screenshots could not be loaded. Please try again later.</p>}

      <section>
        <h2 className="mb-2 font-semibold">About this app</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{app.description || app.short_description}</p>
      </section>

      {app.features.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Features</h2>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {app.features.map((f) => <li key={f} className="flex gap-2"><span className="mt-2 size-1.5 rounded-full bg-primary" />{f}</li>)}
          </ul>
        </section>
      )}

      <section className="grid gap-px overflow-hidden rounded-lg border bg-border text-sm sm:grid-cols-2">
        <Info2 label="Version" value={app.version} />
        <Info2 label="Updated" value={new Date(app.updated_at).toLocaleDateString()} />
        <Info2 label="Platforms" value={app.platforms.join(", ")} />
        <Info2 label="Hosted at" value={host} />
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        {(app.website_url || app.developer?.website) && (
          <a href={app.website_url || app.developer?.website || ""} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary"><Globe className="size-4" /> Developer website</a>
        )}
        {app.privacy_url ? (
          <a href={app.privacy_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary"><Shield className="size-4" /> Privacy policy</a>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground"><Shield className="size-4" /> No privacy policy provided</span>
        )}
        <button onClick={report} className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Flag className="size-4" /> Report</button>
      </div>

      <InstallDialog app={app} open={installOpen} onOpenChange={setInstallOpen} />
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
