import { describe, expect, it } from "vitest";
import { canSubmitStatus, imageExtension, imageReferenceSchema, submissionSchema } from "@/lib/app-submission";

describe("App submission rules", () => {
  it("only allows admins to list an app", () => {
    expect(canSubmitStatus(false, "published")).toBe(false);
    expect(canSubmitStatus(true, "published")).toBe(true);
    expect(canSubmitStatus(false, "submitted")).toBe(true);
  });
  it("accepts uploaded images or HTTPS image links", () => {
    expect(imageReferenceSchema.safeParse("storage://app-media/12345678-abcd/12345678-abcd.png").success).toBe(true);
    expect(imageReferenceSchema.safeParse("https://example.org/icon.png").success).toBe(true);
    expect(imageReferenceSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
  it("validates actual image signatures instead of trusting filenames", () => {
    expect(imageExtension(new Uint8Array([137,80,78,71,13,10,26,10]))).toBe("png");
    expect(() => imageExtension(new TextEncoder().encode("<script>bad</script>"))).toThrow();
  });
  it("rejects non-HTTPS app destinations", () => {
    const data = { name: "App", slug: "app", short_description: "Business app", description: "", app_url: "http://example.org", website_url: "", icon_url: "", category_id: "", developer_id: "", author_name: "Owner", version: "1", status: "submitted", keywords: [], features: [] };
    expect(submissionSchema.safeParse(data).success).toBe(false);
    expect(submissionSchema.safeParse({ ...data, app_url: "https://example.org" }).success).toBe(true);
  });
});