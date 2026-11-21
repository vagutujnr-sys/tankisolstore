import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { isSuperAdmin, user: me } = useAuth();
  const { data } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as Role),
      }));
    },
  });

  async function toggleSuspend(id: string, v: boolean) {
    const { error } = await supabase.from("profiles").update({ is_suspended: v }).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success(v ? "User suspended" : "User restored");
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }
  async function toggleAdmin(id: string, has: boolean) {
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin")
      : await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
    if (error) return void toast.error(error.message);
    toast.success(has ? "Admin rights removed" : "Admin rights given");
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <div className="divide-y rounded-xl border bg-card">
        {data?.map((u) => {
          const isAdminRole = u.roles.includes("admin");
          const isSuper = u.roles.includes("super_admin");
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{u.display_name || u.email}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {u.roles.map((r) => (
                  <span key={r} className="rounded-full bg-secondary px-2 py-0.5 text-xs">{r.replace("_", " ")}</span>
                ))}
                {u.is_suspended && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">suspended</span>}
              </div>
              {!isSuper && u.id !== me?.id && (
                <div className="flex gap-1">
                  {isSuperAdmin && (
                    <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdminRole)}>
                      {isAdminRole ? "Remove admin" : "Make admin"}
                    </Button>
                  )}
                  <Button size="sm" variant={u.is_suspended ? "outline" : "destructive"} onClick={() => toggleSuspend(u.id, !u.is_suspended)}>
                    {u.is_suspended ? "Restore" : "Suspend"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
