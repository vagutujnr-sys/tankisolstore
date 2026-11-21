import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Heart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppIcon } from "@/components/store/AppIcon";
import { Button } from "@/components/ui/button";
import { markLibrary, trackInstallEvent } from "@/lib/install";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-apps")({
  head: () => ({
    meta: [
      { title: "My Apps — TankiSol" },
      { name: "description", content: "Your saved, favourite and recently opened apps." },
      { property: "og:title", content: "My Apps — TankiSol" },
      { property: "og:description", content: "Your personal app library on TankiSol." },
    ],
  }),
  component: MyApps,
});

const TABS = ["All", "Favourites", "Recent"] as const;
const STATE_LABEL: Record<string, string> = { added: "Added", requested: "Install started", confirmed: "Installed" };

function MyApps() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const { data, isLoading } = useQuery({
    queryKey: ["library", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("user_app_library").select("*, app:applications(id, slug, name, icon_url, app_url, short_description)").eq("user_id", user!.id).order("updated_at", { ascending: false })).data ?? [],
  });

  if (loading) return null;
  if (!user)
    return (
      <div className="mx-auto max-w-sm py-12 text-center">
        <h1 className="text-xl font-semibold">My Apps</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to keep a library of your apps and favourites.</p>
        <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>
      </div>
    );

  let rows = (data ?? []).filter((r) => r.app);
  if (tab === "Favourites") rows = rows.filter((r) => r.is_favourite);
  if (tab === "Recent") rows = rows.filter((r) => r.last_opened_at).sort((a, b) => b.last_opened_at!.localeCompare(a.last_opened_at!));

  async function update(id: string, patch: { is_favourite?: boolean }) {
    await supabase.from("user_app_library").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["library"] });
  }
  async function remove(id: string) {
    await supabase.from("user_app_library").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["library"] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Apps</h1>
      <p className="text-sm text-muted-foreground">Your browser can't see which apps are installed on your device, so this shows what you've done through TankiSol.</p>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-full border px-4 py-1.5 text-sm", tab === t && "border-primary bg-accent text-accent-foreground")}>{t}</button>
        ))}
      </div>
      {isLoading ? null : rows.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">Nothing here yet. <Link to="/explore" className="text-primary">Explore apps</Link></p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3">
              <Link to="/apps/$slug" params={{ slug: r.app!.slug }}><AppIcon name={r.app!.name} src={r.app!.icon_url} className="size-12" /></Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.app!.name}</p>
                <p className="text-xs text-muted-foreground">
                  {STATE_LABEL[r.install_state]}{r.last_opened_at && ` · Opened ${new Date(r.last_opened_at).toLocaleDateString()}`}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Favourite" onClick={() => update(r.id, { is_favourite: !r.is_favourite })}>
                <Heart className={r.is_favourite ? "fill-primary text-primary" : ""} />
              </Button>
              <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(r.id)}><Trash2 /></Button>
              <Button size="sm" onClick={() => { trackInstallEvent(r.app!.id, "app_opened"); markLibrary(r.app!.id, "added", true); window.open(r.app!.app_url, "_blank", "noopener"); qc.invalidateQueries({ queryKey: ["library"] }); }}>
                Open <ExternalLink />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
