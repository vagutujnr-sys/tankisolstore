import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { ChevronRight, Megaphone } from "lucide-react";
import { categoriesQuery, publishedAppsQuery, type AppRecord } from "@/lib/apps";
import { AppListItem, AppTile } from "@/components/store/AppListItem";
import { AppIcon } from "@/components/store/AppIcon";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TankiSol Appstore — Where PWAs Shine" },
      { name: "description", content: "Discover, install and open Progressive Web Apps from TankiSol and trusted developers." },
      { property: "og:title", content: "TankiSol Appstore — Where PWAs Shine" },
      { property: "og:description", content: "Discover, install and open Progressive Web Apps." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(publishedAppsQuery()), context.queryClient.ensureQueryData(categoriesQuery())]),
  component: Home,
});

const SECTIONS: { title: string; slug: string }[] = [
  { title: "Business", slug: "business-finance" },
  { title: "Productivity", slug: "productivity" },
  { title: "Lifestyle", slug: "health-lifestyle" },
  { title: "Community", slug: "community" },
];

function Home() {
  const { data: apps } = useSuspenseQuery(publishedAppsQuery());
  const { data: ann } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("marketplace_announcements").select("*").eq("is_active", true).limit(1)).data ?? [],
  });
  const featured = apps.filter((a) => a.is_featured);
  const recent = apps.slice(0, 6);

  return (
    <div className="space-y-8">
      {ann?.[0] && (
        <div className="flex gap-3 rounded-lg border bg-card p-3 text-sm">
          <Megaphone className="size-4 shrink-0 text-primary" />
          <div><b>{ann[0].title}</b> <span className="text-muted-foreground">{ann[0].body}</span></div>
        </div>
      )}

      {featured.length > 0 && (
        <section>
          <SectionHead title="Featured" to="/explore" />
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((a) => <FeatureCard key={a.id} app={a} />)}
          </div>
        </section>
      )}

      <section>
        <SectionHead title="Recently added" to="/explore" />
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4">
          {recent.map((a) => <AppTile key={a.id} app={a} />)}
        </div>
      </section>

      <section>
        <SectionHead title="Recommended for you" to="/explore" />
        <div className="grid gap-1 md:grid-cols-2 md:gap-x-8">
          {apps.slice(0, 6).map((a) => <AppListItem key={a.id} app={a} />)}
        </div>
      </section>

      {SECTIONS.map((s) => {
        const list = apps.filter((a) => a.category?.slug === s.slug);
        if (!list.length) return null;
        return (
          <section key={s.slug}>
            <SectionHead title={s.title} to="/categories/$slug" slug={s.slug} />
            <div className="grid gap-1 md:grid-cols-2 md:gap-x-8">
              {list.slice(0, 4).map((a) => <AppListItem key={a.id} app={a} />)}
            </div>
          </section>
        );
      })}

      <section className="rounded-lg bg-charcoal p-5 text-charcoal-foreground">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Developer spotlight</p>
        <h2 className="mt-1 text-xl font-semibold">Publish your PWA on TankiSol</h2>
        <p className="mt-1 text-sm opacity-80">Reach new users and give them a one-tap install experience with the TankiSol bridge.</p>
        <div className="mt-4 grid gap-2 sm:flex">
          <Link to="/developer" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Become a developer</Link>
          <Link to="/bridge" className="rounded-md border border-current/30 px-4 py-2 text-sm font-semibold">Bridge docs</Link>
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, to, slug }: { title: string; to: "/explore" | "/categories/$slug"; slug?: string }) {
  return (
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {to === "/explore" ? (
        <Link to="/explore" className="flex items-center text-sm font-medium text-primary">See all <ChevronRight className="size-4" /></Link>
      ) : (
        <Link to="/categories/$slug" params={{ slug: slug ?? "" }} className="flex shrink-0 items-center text-sm font-medium text-primary">See all <ChevronRight className="size-4" /></Link>
      )}
    </div>
  );
}

function FeatureCard({ app }: { app: AppRecord }) {
  return (
    <Link to="/apps/$slug" params={{ slug: app.slug }} className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary">
      <AppIcon name={app.name} src={app.icon_url} className="size-16 text-2xl" />
      <div className="min-w-0">
        <p className="font-semibold">{app.name}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{app.short_description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{app.category?.name}</p>
      </div>
    </Link>
  );
}
