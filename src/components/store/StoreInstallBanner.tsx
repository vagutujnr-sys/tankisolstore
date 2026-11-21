import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { detectDevice } from "@/lib/install";
import { useStoreInstall } from "@/lib/pwa";

const DISMISS_KEY = "tankisol-install-dismissed-until";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export function StoreInstallBanner() {
  const { canPrompt, installed, prompt } = useStoreInstall();
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    setIos(detectDevice().platform === "ios");
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY));
    setHidden(Number.isFinite(dismissedUntil) && dismissedUntil > Date.now());
  }, []);

  if (installed || hidden || (!canPrompt && !ios)) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION));
    setHidden(true);
  }

  return (
    <>
      <div className="border-b bg-charcoal text-charcoal-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm">
          <Download className="size-4 shrink-0 text-primary" />
          <p className="flex-1">Install TankiSol for quick access to your appstore.</p>
          <Button size="sm" onClick={() => (ios ? setShowIosHelp(true) : prompt())}>
            {ios ? "How to install" : "Install TankiSol"}
          </Button>
          <button
            onClick={dismiss}
            aria-label="Dismiss install reminder for 7 days"
            className="opacity-70 hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install TankiSol on iPhone or iPad</DialogTitle>
            <DialogDescription>
              Add TankiSol to your Home Screen to launch it like an app. Safari is the most reliable
              way to do this.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <Step n={1}>
              Open this page in Safari. If you are in another browser or an in-app window, copy the
              address and open it in Safari.
            </Step>
            <Step n={2}>
              Tap <Share className="inline size-4" /> <b>Share</b> in Safari's toolbar.
            </Step>
            <Step n={3}>
              Scroll the share sheet if needed, then tap <SquarePlus className="inline size-4" />{" "}
              <b>Add to Home Screen</b>.
            </Step>
            <Step n={4}>
              Tap <b>Add</b>. Find the TankiSol icon on your Home Screen and open it from there.
            </Step>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-charcoal text-xs font-semibold text-charcoal-foreground">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
