import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { categoriesQuery, publishedAppsQuery } from "@/lib/apps";
import { AppListItem } from "@/components/store/AppListItem";

export const Route = createFileRoute("/categories/$slug")({
  loader: async ({ context, params }) => {
    const cats = await context.queryClient.ensureQueryData(categoriesQuery());
    await context.queryClient.ensureQueryData(publishedAppsQuery());
    const cat = cats.find((c) => c.slug === params.slug);
    if (!cat) throw notFound();
    return { name: cat.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Category"} apps — TankiSol` },
      { name: "description", content: `Browse ${loaderData?.name ?? ""} Progressive Web Apps on TankiSol.` },
      { property: "og:title", content: `${loaderData?.name ?? "Category"} apps — TankiSol` },
      { property: "og:description", content: `Browse ${loaderData?.name ?? ""} apps.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { name } = Route.useLoaderData();
  const { data: apps } = useSuspenseQuery(publishedAppsQuery());
  const list = apps.filter((a) => a.category?.slug === slug);
  return (
    <div>
      <Link to="/categories" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Categories</Link>
      <h1 className="mb-4 text-2xl font-semibold">{name}</h1>
      {list.length ? (
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-8">{list.map((a) => <AppListItem key={a.id} app={a} />)}</div>
      ) : (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No apps in this category yet.</p>
      )}
    </div>
  );
}
