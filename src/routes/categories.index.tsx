import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, publishedAppsQuery } from "@/lib/apps";
import { CategoryIcon } from "@/components/store/CategoryIcon";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Categories — TankiSol" },
      { name: "description", content: "Browse Progressive Web Apps by category." },
      { property: "og:title", content: "Categories — TankiSol" },
      { property: "og:description", content: "Browse Progressive Web Apps by category." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(categoriesQuery()), context.queryClient.ensureQueryData(publishedAppsQuery())]),
  component: Categories,
});

function Categories() {
  const { data: cats } = useSuspenseQuery(categoriesQuery());
  const { data: apps } = useSuspenseQuery(publishedAppsQuery());
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Categories</h1>
      <div className="grid grid-cols-2 gap-2">
        {cats.map((c) => {
          const n = apps.filter((a) => a.category_id === c.id).length;
          return (
            <Link key={c.id} to="/categories/$slug" params={{ slug: c.slug }} className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary">
              <span className="grid size-10 place-items-center"><CategoryIcon name={c.icon} className="size-5" /></span>
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">{n} app{n === 1 ? "" : "s"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
