import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

export function useAppImage(reference: string | null) {
  const { user } = useAuth();
  const privateImage = reference?.startsWith("storage://app-media/") ?? false;
  const { data, error, isError } = useQuery({
    queryKey: ["app-image", reference, user?.id],
    enabled: privateImage,
    staleTime: 40 * 60 * 1000,
    refetchInterval: privateImage ? 45 * 60 * 1000 : false,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const path = reference?.slice("storage://app-media/".length);
      if (!path) return null;
      const { data, error } = await supabase.storage.from("app-media").createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return { image: privateImage ? data ?? null : reference, error: privateImage && isError ? error : null };
}