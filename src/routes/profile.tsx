import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Code2, LogOut, ShieldCheck, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHttpsUrl } from "@/lib/apps";
import { useStoreInstall } from "@/lib/pwa";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TankiSol" },
      { name: "description", content: "Manage your TankiSol profile." },
      { property: "og:title", content: "Profile — TankiSol" },
      { property: "og:description", content: "Manage your TankiSol profile." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, loading, isAdmin, roles } = useAuth();
  const qc = useQueryClient();
  const store = useStoreInstall();
  const [busy, setBusy] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  if (loading) return null;
  if (!user)
    return (
      <div className="mx-auto max-w-sm py-12 text-center">
        <h1 className="text-xl font-semibold">Your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browsing is free. Sign in to save apps and favourites.</p>
        <Button asChild className="mt-4"><Link to="/auth">Sign in or create account</Link></Button>
      </div>
    );

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const avatar = String(f.get("avatar") || "").trim();
    if (avatar && !isHttpsUrl(avatar)) { toast.error("Profile image must be an https link"); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: String(f.get("name")), avatar_url: avatar || null }).eq("id", user!.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="grid size-16 place-items-center rounded-full bg-charcoal font-display text-xl text-charcoal-foreground">{(profile?.display_name || user.email || "?").charAt(0).toUpperCase()}</div>
        )}
        <div>
          <h1 className="text-xl font-semibold">{profile?.display_name || "Your profile"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">{roles.filter((r) => r !== "user").join(", ")}</p>
        </div>
      </div>

      {profile && (
        <form onSubmit={save} className="space-y-3 rounded-lg border bg-card p-4">
          <div className="space-y-1"><Label htmlFor="name">Display name</Label><Input id="name" name="name" defaultValue={profile.display_name ?? ""} /></div>
          <div className="space-y-1"><Label htmlFor="avatar">Profile image link</Label><Input id="avatar" name="avatar" placeholder="https://…" defaultValue={profile.avatar_url ?? ""} /></div>
          <Button disabled={busy}>Save</Button>
        </form>
      )}

      <div className="divide-y rounded-lg border bg-card">
        {isAdmin && <Row to="/admin" icon={<ShieldCheck className="size-4" />} label="Admin portal" />}
        <Row to="/developer" icon={<Code2 className="size-4" />} label="Developer dashboard" />
        {!store.installed && store.canPrompt && (
          <button onClick={() => store.prompt()} className="flex w-full items-center gap-3 p-3 text-left text-sm"><Download className="size-4" /> Install TankiSol</button>
        )}
        <button onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-3 p-3 text-left text-sm text-destructive"><LogOut className="size-4" /> Sign out</button>
      </div>
    </div>
  );
}

function Row({ to, icon, label }: { to: "/admin" | "/developer"; icon: React.ReactNode; label: string }) {
  return <Link to={to} className="flex items-center gap-3 p-3 text-sm hover:bg-secondary">{icon}{label}</Link>;
}
