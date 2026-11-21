import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Compass, LayoutGrid, Library, User, Search, ShieldCheck } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { StoreInstallBanner } from "./StoreInstallBanner";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/my-apps", label: "My Apps", icon: Library },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate({ to: "/explore", search: { q: q.trim() || undefined } });
  }

  return (
    <div className="min-h-screen pb-24 pt-20">
      <header className="fixed inset-x-0 top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 xl:flex">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src="/icons/appicon.png" alt="TankiSol Appstore" className="size-10 object-contain" />
            <span className="hidden font-display text-lg font-bold lg:block">
              Tanki<span className="text-primary">Sol</span>
            </span>
          </Link>
          <form onSubmit={onSearch} className="relative min-w-0 flex-1 xl:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps"
              aria-label="Search apps"
              className="h-10 w-full rounded-full border bg-secondary pl-9 pr-4 text-sm outline-none focus:border-primary focus:bg-card"
            />
          </form>
          <nav className="ml-auto hidden shrink-0 items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
                  isActive(n.to) && "text-primary",
                )}
              >
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="ml-1 flex items-center gap-1 rounded-md bg-charcoal px-3 py-2 text-sm font-medium text-charcoal-foreground">
                <ShieldCheck className="size-4" /> Admin
              </Link>
            )}
          </nav>
          {isAdmin && (
            <Link to="/admin" aria-label="Admin" className="shrink-0 text-muted-foreground xl:hidden">
              <ShieldCheck className="size-5" />
            </Link>
          )}
        </div>
        <p className="pb-1 text-center text-[10px] font-medium text-muted-foreground">Official App Marketplace</p>
      </header>
      <StoreInstallBanner />
      <main className="mx-auto max-w-6xl px-4 py-5">{children}</main>
      <nav aria-label="Bottom navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-card">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {NAV.map((n) => {
            const active = isActive(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active && "justify-center",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-full",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <n.icon className="size-5" />
                </span>
                <span className={active ? "sr-only" : "text-muted-foreground"}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
