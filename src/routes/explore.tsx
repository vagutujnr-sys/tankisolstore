import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriesQuery, publishedAppsQuery, searchApps, type SortKey } from "@/lib/apps";
import { AppListItem } from "@/components/store/AppListItem";

type Search = { q?: string | undefined; sort?: SortKey | undefined; category?: string | undefined; price?: "free" | "paid" | undefined };

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    sort: ["popular", "recent", "featured", "name"].includes(s["sort"] as string) ? (s["sort"] as SortKey) : undefined,
    category: typeof s["category"] === "string" ? s["category"] : undefined,
    price: s["price"] === "free" || s["price"] === "paid" ? s["price"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore apps — TankiSol" },
      { name: "description", content: "Search and filter Progressive Web Apps by name, developer, category or keyword." },
      { property: "og:title", content: "Explore apps — TankiSol" },
      { property: "og:description", content: "Search Progressive Web Apps on TankiSol." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(publishedAppsQuery()), context.queryClient.ensureQueryData(categoriesQuery())]),
  component: Explore,
});

const select = "h-10 rounded-md border bg-card px-3 text-sm";

function Explore() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const { data: apps } = useSuspenseQuery(publishedAppsQuery());
  const { data: cats } = useSuspenseQuery(categoriesQuery());
  const results = searchApps(apps, search.q ?? "", search);
  const set = (patch: Partial<Search>) => navigate({ search: (p) => ({ ...p, ...patch }) });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{search.q ? `Results for “${search.q}”` : "Explore"}</h1>
      <input
        defaultValue={search.q}
        key={search.q}
        onChange={(e) => set({ q: e.target.value || undefined })}
        placeholder="Search by name, developer, category or keyword"
        className="h-11 w-full rounded-md border bg-card px-3 text-sm outline-none focus:border-primary"
      />
      <div className="flex flex-wrap gap-2">
        <select aria-label="Sort" className={select} value={search.sort ?? "featured"} onChange={(e) => set({ sort: e.target.value as SortKey })}>
          <option value="featured">Featured</option>
          <option value="popular">Most popular</option>
          <option value="recent">Recently added</option>
          <option value="name">Name A–Z</option>
        </select>
        <select aria-label="Category" className={select} value={search.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select aria-label="Price" className={select} value={search.price ?? ""} onChange={(e) => set({ price: (e.target.value || undefined) as Search["price"] })}>
          <option value="">Free & paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <p className="text-sm text-muted-foreground">{results.length} app{results.length === 1 ? "" : "s"}</p>
      {results.length ? (
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-8">{results.map((a) => <AppListItem key={a.id} app={a} />)}</div>
      ) : (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No apps match your search yet.</p>
      )}
    </div>
  );
}
