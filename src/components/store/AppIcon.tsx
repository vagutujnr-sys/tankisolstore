import { cn } from "@/lib/utils";
import { useAppImage } from "@/lib/app-media";

export function AppIcon({ name, src, className }: { name: string; src: string | null; className?: string }) {
  const { image, error } = useAppImage(src);
  if (image) return <img src={image} alt={`${name} icon`} loading="lazy" className={cn("app-icon size-14", className)} />;
  return (
    <div
      aria-label={error ? `${name} icon failed to load` : `${name} icon`}
      title={error instanceof Error ? `Icon could not be loaded: ${error.message}` : undefined}
      className={cn("app-icon size-14 grid place-items-center bg-charcoal text-charcoal-foreground font-display font-semibold", className)}
    >
      <span className="text-[1.1em]">{name.slice(0, 1)}</span>
    </div>
  );
}
