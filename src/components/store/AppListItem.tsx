import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import type { AppRecord } from "@/lib/apps";
import { AppIcon } from "./AppIcon";

export function AppListItem({ app }: { app: AppRecord }) {
  return (
    <Link
      to="/apps/$slug"
      params={{ slug: app.slug }}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-secondary"
    >
      <AppIcon name={app.name} src={app.icon_url} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold">{app.name}</span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{app.short_description}</p>
        <p className="text-xs text-muted-foreground">
          {app.developer?.name}
          {app.developer?.is_verified && <BadgeCheck className="inline size-3 shrink-0 text-primary" aria-label="Verified developer" />}
          {app.category && <span>· {app.category.name}</span>}
        </p>
      </div>
      <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">View</span>
    </Link>
  );
}

export function AppTile({ app }: { app: AppRecord }) {
  return (
    <Link to="/apps/$slug" params={{ slug: app.slug }} className="group w-24 shrink-0">
      <AppIcon name={app.name} src={app.icon_url} className="size-24 text-3xl transition-transform group-hover:scale-[1.03]" />
      <p className="mt-2 truncate text-sm font-medium">{app.name}</p>
      <p className="truncate text-xs text-muted-foreground">{app.category?.name}</p>
    </Link>
  );
}
