import { useAppImage } from "@/lib/app-media";

export function AppScreenshot({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { image, error } = useAppImage(src);
  return image
    ? <img src={image} alt={alt} loading="lazy" className={className} />
    : <div role={error ? "alert" : undefined} title={error instanceof Error ? error.message : undefined} className="grid h-32 place-items-center bg-muted px-3 text-center text-sm text-muted-foreground">{error ? "Image could not be loaded" : "Image unavailable"}</div>;
}