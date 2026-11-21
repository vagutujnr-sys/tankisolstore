import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
};

export type AppRecord = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  icon_url: string | null;
  category_id: string | null;
  developer_id: string | null;
  app_url: string;
  install_url: string | null;
  bridge_enabled: boolean;
  website_url: string | null;
  privacy_url: string | null;
  version: string;
  platforms: string[];
  features: string[];
  keywords: string[];
  is_free: boolean;
  is_featured: boolean;
  is_demo: boolean;
  status: string;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  category?: { name: string; slug: string } | null;
  developer?: { name: string; is_verified: boolean; website: string | null } | null;
};

const APP_SELECT =
  "*, category:application_categories(name, slug), developer:developers(name, is_verified, website)";

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

export const publishedAppsQuery = () =>
  queryOptions({
    queryKey: ["apps", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(APP_SELECT)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as unknown as AppRecord[];
    },
  });

export const appBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["app", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(APP_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as AppRecord) ?? null;
    },
  });

export const screenshotsQuery = (appId: string) =>
  queryOptions({
    queryKey: ["screenshots", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_screenshots")
        .select("id, url")
        .eq("application_id", appId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export type SortKey = "popular" | "recent" | "featured" | "name";

/** Pure search over app records: name, developer, category, keywords, description. */
export function searchApps(apps: AppRecord[], q: string, opts: { category?: string | undefined; price?: "free" | "paid" | undefined; sort?: SortKey | undefined } = {}) {
  const term = q.trim().toLowerCase();
  let out = apps.filter((a) => {
    if (opts.category && a.category?.slug !== opts.category) return false;
    if (opts.price === "free" && !a.is_free) return false;
    if (opts.price === "paid" && a.is_free) return false;
    if (!term) return true;
    const hay = [a.name, a.short_description, a.description, a.developer?.name, a.category?.name, ...a.keywords]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return term.split(/\s+/).every((t) => hay.includes(t));
  });
  const sort = opts.sort ?? "featured";
  out = [...out].sort((a, b) => {
    if (sort === "recent") return b.created_at.localeCompare(a.created_at);
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "featured" || sort === "popular") return Number(b.is_featured) - Number(a.is_featured) || a.name.localeCompare(b.name);
    return 0;
  });
  return out;
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function isHttpsUrl(s: string) {
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}
