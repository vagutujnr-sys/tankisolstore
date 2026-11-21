import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SCREENSHOTS = 8;
export const imageReferenceSchema = z.string().max(2048).refine((v) => !v || /^storage:\/\/app-media\/[a-f0-9-]+\/[a-f0-9-]+\.(png|jpg|jpeg|webp)$/.test(v) || isSecureUrl(v), "Use an HTTPS image link");
export function isSecureUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !!url.hostname && !url.username && !url.password; } catch { return false; }
}
export const submissionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  short_description: z.string().trim().min(1).max(200),
  description: z.string().max(6000),
  app_url: z.string().max(2048).refine(isSecureUrl, "App link must use HTTPS"),
  website_url: z.string().max(2048).refine((v) => !v || isSecureUrl(v), "Website must use HTTPS"),
  icon_url: imageReferenceSchema,
  category_id: z.union([z.literal(""), z.string().uuid()]),
  developer_id: z.union([z.literal(""), z.string().uuid()]),
  author_name: z.string().trim().max(100),
  version: z.string().max(40),
  status: z.enum(["draft", "submitted", "under_review", "approved", "published", "rejected", "suspended"]),
  keywords: z.array(z.string().max(100)).max(30),
  features: z.array(z.string().max(300)).max(30),
});
export function canSubmitStatus(admin: boolean, status: string) { return admin || status === "draft" || status === "submitted"; }
export function imageExtension(bytes: Uint8Array) {
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return "png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  if (String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "webp";
  throw new Error("Choose a PNG, JPEG or WebP image");
}