import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { imageExtension, MAX_IMAGE_BYTES } from "./app-submission";

export const uploadAppImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FormData) => {
    const file = input.get("image");
    if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES) throw new Error("Choose an image up to 5 MB");
    return file;
  })
  .handler(async ({ data: file, context }) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = imageExtension(bytes);
    const path = `${context.userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await context.supabase.storage.from("app-media").upload(path, bytes, { contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}` });
    if (error) throw new Error(error.message);
    return `storage://app-media/${path}`;
  });