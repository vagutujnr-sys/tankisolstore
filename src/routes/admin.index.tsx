import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

async function count(table: "applications" | "profiles" | "application_views" | "installation_events" | "application_categories", f?: (q: any) => any) {
  let q: any = supabase.from(table).select("id", { count: "exact", head: true });
  if (f) q = f(q);
  const { count: c } = await q;
  return c ?? 0;
}

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [apps, published, pending, users, views, installs, cats] = await Promise.all([
        count("applications"),
        count("applications", (q) => q.eq("status", "published")),
        count("applications", (q) => q.in("status", ["submitted", "under_review", "approved"])),
        count("profiles"),
        count("application_views"),
        count("installation_events", (q) => q.eq("event_type", "install_confirmed")),
        count("application_categories"),
      ]);
      const { data: ev } = await supabase
        .from("installation_events")
        .select("application_id, event_type")
        .order("created_at", { ascending: false })
        .limit(1000);
      const { data: vw } = await supabase.from("application_views").select("application_id").limit(1000);
      const { data: names } = await supabase.from("applications").select("id, name, slug");
      const per = new Map<string, { views: number; installs: number }>();
      (vw ?? []).forEach((v) => {
        const e = per.get(v.application_id) ?? { views: 0, installs: 0 };
        e.views++;
        per.set(v.application_id, e);
      });
      (ev ?? []).forEach((v) => {
        const e = per.get(v.application_id) ?? { views: 0, installs: 0 };
        if (v.event_type === "install_confirmed") e.installs++;
        per.set(v.application_id, e);
      });
      const top = (names ?? [])
        .map((n) => ({ ...n, ...(per.get(n.id) ?? { views: 0, installs: 0 }) }))
        .sort((a, b) => b.views + b.installs * 5 - (a.views + a.installs * 5))
        .slice(0, 8);
      return { apps, published, pending, users, views, installs, cats, top };
    },
  });

  const cards = [
    ["Total apps", data?.apps],
    ["Listed on store", data?.published],
    ["Waiting for listing", data?.pending],
    ["Users", data?.users],
    ["App views", data?.views],
    ["Confirmed installs", data?.installs],
    ["Categories", data?.cats],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Store overview</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, v]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{v ?? "–"}</p>
          </div>
        ))}
      </div>
      {!!data?.pending && (
        <Link to="/admin/apps" search={{ status: "pending" }} className="block rounded-xl bg-accent p-4 text-sm font-medium text-accent-foreground">
          {data.pending} app{data.pending > 1 ? "s are" : " is"} waiting for you to list on the store →
        </Link>
      )}
      <section className="rounded-xl border bg-card">
        <h2 className="border-b p-4 font-semibold">Top apps</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr><th className="p-3">App</th><th className="p-3 text-right">Views</th><th className="p-3 text-right">Installs</th></tr>
          </thead>
          <tbody>
            {data?.top.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.name}</td>
                <td className="p-3 text-right">{a.views}</td>
                <td className="p-3 text-right">{a.installs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
