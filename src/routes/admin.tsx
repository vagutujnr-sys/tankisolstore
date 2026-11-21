import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, AppWindow, Tags, Users, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin portal — TankiSol Appstore" },
      { name: "description", content: "Manage TankiSol Appstore listings, categories, users and statistics." },
      { property: "og:title", content: "Admin portal — TankiSol Appstore" },
      { property: "og:description", content: "Manage listings, categories, users and statistics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/apps", label: "Apps", icon: AppWindow },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/users", label: "Users", icon: Users },
] as const;

function AdminLayout() {
  const { loading, user, isAdmin } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );

  if (!user || !isAdmin)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="font-display text-2xl font-bold">Admins only</h1>
        <p className="text-sm text-muted-foreground">
          {user ? "Your account doesn't have admin access." : "Sign in with an admin account to continue."}
        </p>
        <Link to={user ? "/" : "/auth"} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          {user ? "Back to store" : "Sign in"}
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen md:flex">
      <aside className="fixed inset-x-0 top-0 z-30 border-b bg-charcoal text-charcoal-foreground md:inset-x-auto md:bottom-0 md:left-0 md:w-60 md:border-b-0">
        <div className="flex items-center gap-2 p-4">
          <img src="/icons/appicon.png" alt="" className="size-9 object-contain" />
          <div>
            <p className="font-display font-bold leading-tight">TankiSol</p>
            <p className="text-xs opacity-70">Admin portal</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
          {NAV.map((n) => {
            const active = "exact" in n ? path === n.to || path === n.to + "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium opacity-80 hover:opacity-100",
                  active && "bg-primary text-primary-foreground opacity-100",
                )}
              >
                <n.icon className="size-4" /> {n.label}
              </Link>
            );
          })}
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm opacity-70 hover:opacity-100 md:mt-4">
            <ArrowLeft className="size-4" /> Back to store
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-4 pt-36 md:ml-60 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
