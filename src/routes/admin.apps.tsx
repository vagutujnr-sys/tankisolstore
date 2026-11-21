import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Star, Store, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { type AppRecord } from "@/lib/apps";
import { AppIcon } from "@/components/store/AppIcon";
import { Button } from "@/components/ui/button";
import { AppSubmissionForm } from "@/components/store/AppSubmissionForm";

type StatusFilter = "all" | "pending" | "published" | "hidden";

export const Route = createFileRoute("/admin/apps")({
  validateSearch: (s: Record<string, unknown>): { status?: StatusFilter } => {
    const v = s["status"];
    return v === "pending" || v === "published" || v === "hidden" ? { status: v } : {};
  },
  head: () => ({ meta: [{ title: "Manage apps — TankiSol Appstore" }, { name: "description", content: "Manage app listings and submissions on TankiSol." }, { property: "og:title", content: "Manage apps — TankiSol Appstore" }, { property: "og:description", content: "Manage app listings and submissions on TankiSol." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminApps,
});

const PENDING = ["submitted", "under_review", "approved"];

const adminAppsQuery = {
  queryKey: ["admin", "apps"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("applications")
      .select("*, category:application_categories(name, slug), developer:developers(name, is_verified, website)")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data as unknown as AppRecord[];
  },
};

function AdminApps() {
  const { status = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/apps" });
  const qc = useQueryClient();
  const { data: apps = [] } = useQuery(adminAppsQuery);
  const [editing, setEditing] = useState<AppRecord | "new" | null>(null);

  const list = apps.filter((a) =>
    status === "pending" ? PENDING.includes(a.status) : status === "published" ? a.status === "published" : status === "hidden" ? a.status !== "published" : true,
  );

  async function update(id: string, patch: Partial<AppRecord>, msg: string) {
    const { error } = await supabase.from("applications").update(patch as never).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success(msg);
    qc.invalidateQueries();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Apps</h1>
        <Button onClick={() => setEditing("new")}><Plus className="size-4" /> Add app</Button>
      </div>
      <p className="text-sm text-muted-foreground">Only admins can list an app on the store. Apps stay hidden until you press “List on store”.</p>
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "published", "hidden"] as const).map((s) => (
          <button
            key={s}
            onClick={() => navigate({ search: s === "all" ? {} : { status: s } })}
            className={`rounded-full border px-3 py-1 text-sm capitalize ${status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {s === "pending" ? "Waiting" : s === "published" ? "Listed" : s}
          </button>
        ))}
      </div>
      <div className="divide-y rounded-xl border bg-card">
        {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No apps here.</p>}
        {list.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 p-3">
            <AppIcon name={a.name} src={a.icon_url} className="size-12" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold">
                {a.name}
                {a.is_featured && <Star className="size-3.5 fill-primary text-primary" aria-label="Featured" />}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {a.developer?.name ?? "No developer"} · {a.category?.name ?? "No category"}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "published" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {a.status === "published" ? "Listed" : a.status.replace("_", " ")}
            </span>
            <div className="flex gap-1">
              {a.status === "published" ? (
                <Button size="sm" variant="outline" onClick={() => update(a.id, { status: "approved" }, `${a.name} hidden from store`)}>
                  <EyeOff className="size-4" /> Unlist
                </Button>
              ) : (
                <Button size="sm" onClick={() => update(a.id, { status: "published" }, `${a.name} is now on the store`)}>
                  <Store className="size-4" /> List on store
                </Button>
              )}
              <Button size="sm" variant="ghost" aria-label="Toggle featured" onClick={() => update(a.id, { is_featured: !a.is_featured }, a.is_featured ? "Removed from featured" : "Featured")}>
                <Star className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => setEditing(a)}><Pencil className="size-4" /></Button>
              <Button size="sm" variant="ghost" asChild aria-label="View">
                <Link to="/apps/$slug" params={{ slug: a.slug }}><ExternalLink className="size-4" /></Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
      {editing && <AppSubmissionForm admin app={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
