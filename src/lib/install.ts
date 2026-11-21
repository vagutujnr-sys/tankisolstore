import { supabase } from "@/integrations/supabase/client";
import type { AppRecord } from "./apps";

export type Platform = "android" | "ios" | "desktop";
export type Browser = "chrome" | "edge" | "samsung" | "safari" | "firefox" | "other";

export function detectDevice(ua: string = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);
  const platform: Platform = isIOS ? "ios" : /Android/i.test(ua) ? "android" : "desktop";
  let browser: Browser = "other";
  if (/SamsungBrowser/i.test(ua)) browser = "samsung";
  else if (/Edg\//i.test(ua)) browser = "edge";
  else if (/Firefox|FxiOS/i.test(ua)) browser = "firefox";
  else if (/CriOS|Chrome/i.test(ua)) browser = "chrome";
  else if (/Safari/i.test(ua)) browser = "safari";
  return { platform, browser };
}

/** Whether a browser can show a native install dialog for a PWA. */
export function supportsNativePrompt(platform: Platform, browser: Browser) {
  if (platform === "ios") return false;
  return browser === "chrome" || browser === "edge" || browser === "samsung";
}

export type InstallEvent =
  | "install_click"
  | "handoff_initiated"
  | "prompt_shown"
  | "install_accepted"
  | "install_dismissed"
  | "install_confirmed"
  | "app_opened";

export async function trackInstallEvent(appId: string, event: InstallEvent) {
  const { platform, browser } = detectDevice();
  const { data } = await supabase.auth.getSession();
  await supabase.from("installation_events").insert({
    application_id: appId,
    event_type: event,
    platform,
    browser,
    user_id: data.session?.user.id ?? null,
  });
}

/**
 * Handoff URL for the target app. Apps that integrate the TankiSol bridge read
 * `tankisol_install=1` and show their own captured native install prompt.
 */
export function buildHandoffUrl(app: Pick<AppRecord, "app_url" | "install_url" | "bridge_enabled">, origin: string) {
  const url = new URL(app.install_url || app.app_url);
  if (app.bridge_enabled) {
    url.searchParams.set("tankisol_install", "1");
    url.searchParams.set("tankisol_return", origin);
  }
  return url.toString();
}

export async function markLibrary(appId: string, state: "added" | "requested" | "confirmed", opened = false) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const { data: existing } = await supabase
    .from("user_app_library")
    .select("id, install_state")
    .eq("user_id", uid)
    .eq("application_id", appId)
    .maybeSingle();
  const rank = { added: 0, requested: 1, confirmed: 2 } as const;
  const nextState =
    existing && rank[existing.install_state as keyof typeof rank] > rank[state] ? existing.install_state : state;
  await supabase.from("user_app_library").upsert(
    {
      user_id: uid,
      application_id: appId,
      install_state: nextState,
      ...(opened ? { last_opened_at: new Date().toISOString() } : {}),
    },
    { onConflict: "user_id,application_id" },
  );
}
