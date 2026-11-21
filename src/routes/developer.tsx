import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { AppRecord } from "@/lib/apps";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/store/AppIcon";
import { AppSubmissionForm } from "@/components/store/AppSubmissionForm";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "Developers — TankiSol Appstore" },
      { name: "description", content: "Publish your Progressive Web App on the TankiSol Appstore." },
      { property: "og:title", content: "Developers — TankiSol Appstore" },
      { property: "og:description", content: "Publish your Progressive Web App on the TankiSol Appstore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeveloperDashboard,
});

function DeveloperDashboard() {
  const { user, loading } = useAuth();
  const [editing, setEditing] = useState<AppRecord | "new" | null>(null);
  const { data: apps = [], isPending, error } = useQuery({
    queryKey: ["owner-apps", user?.id], enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data: devs, error: devError } = await supabase.from("developers").select("id").eq("user_id", user.id);
      if (devError) throw devError;
      if (!devs?.length) return [];
      const { data, error } = await supabase.from("applications").select("*").in("developer_id", devs.map((d) => d.id)).order("updated_at", { ascending: false });
      if (error) throw error;
      return data as AppRecord[];
    },
  });
  return <div className="mx-auto max-w-3xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">My submissions</h1>{user && <Button onClick={() => setEditing("new")}><Plus className="size-4" />Submit app</Button>}</div>
    {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : !user ? <Button asChild><Link to="/auth">Sign in to submit an app</Link></Button> : <>
      {error && <p role="alert" className="text-sm text-destructive">Could not load submissions.</p>}
      {isPending ? <p className="text-sm text-muted-foreground">Loading submissions…</p> : apps.length === 0 ? <p className="py-8 text-center text-muted-foreground">No submissions yet.</p> : <div className="divide-y border-y">{apps.map((app) => <div key={app.id} className="flex items-center gap-3 py-4"><AppIcon name={app.name} src={app.icon_url} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{app.name}</p><p className="text-xs capitalize text-muted-foreground">{app.status.replaceAll("_", " ")}</p>{app.review_notes && <p className="text-xs text-muted-foreground">{app.review_notes}</p>}</div>{["draft", "submitted", "rejected"].includes(app.status) && <Button variant="outline" size="sm" onClick={() => setEditing(app)}><Pencil className="size-4" />Edit</Button>}</div>)}</div>}
    </>}
    <Button variant="outline" asChild><Link to="/bridge">Bridge docs</Link></Button>
    {editing && <AppSubmissionForm app={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
  </div>;
}
