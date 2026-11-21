import { useEffect, useState } from "react";
import { ExternalLink, Share, SquarePlus, MoreVertical, CheckCircle2, MonitorDown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AppRecord } from "@/lib/apps";
import { buildHandoffUrl, detectDevice, markLibrary, supportsNativePrompt, trackInstallEvent, type Browser, type Platform } from "@/lib/install";

export function InstallDialog({ app, open, onOpenChange }: { app: AppRecord; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [device, setDevice] = useState<{ platform: Platform; browser: Browser }>({ platform: "desktop", browser: "other" });
  const [handedOff, setHandedOff] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setDevice(detectDevice());
      setHandedOff(false);
      setConfirmed(false);
    }
  }, [open]);

  const native = supportsNativePrompt(device.platform, device.browser);

  function continueToApp() {
    const url = buildHandoffUrl(app, window.location.origin);
    trackInstallEvent(app.id, "handoff_initiated");
    markLibrary(app.id, "requested");
    window.open(url, "_blank", "noopener");
    setHandedOff(true);
  }

  function confirm() {
    trackInstallEvent(app.id, "install_confirmed");
    markLibrary(app.id, "confirmed");
    setConfirmed(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Install {app.name}</DialogTitle>
          <DialogDescription>
            {app.name} lives at <span className="font-medium text-foreground">{new URL(app.app_url).host}</span>. Installation finishes on
            its own site.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm">
          {device.platform === "ios" ? (
            <>
              {device.browser !== "safari" && (
                <li className="rounded-md bg-accent p-3 text-accent-foreground">
                  On iPhone, installing works best in Safari. Open the app link in Safari first.
                </li>
              )}
              <Step n={1}>Tap <b>Continue to {app.name}</b> below.</Step>
              <Step n={2}>Tap <Share className="inline size-4" /> <b>Share</b> in Safari's toolbar.</Step>
              <Step n={3}>Choose <SquarePlus className="inline size-4" /> <b>Add to Home Screen</b>, then <b>Add</b>.</Step>
            </>
          ) : native ? (
            <>
              <Step n={1}>Tap <b>Continue to {app.name}</b>. It opens in a new tab.</Step>
              <Step n={2}>
                {app.bridge_enabled
                  ? `${app.name} supports TankiSol and will show the install dialog automatically.`
                  : <>Look for the install icon <MonitorDown className="inline size-4" /> in the address bar, or open the menu <MoreVertical className="inline size-4" /> and pick <b>Install app</b>.</>}
              </Step>
              <Step n={3}>Confirm with <b>Install</b>.</Step>
            </>
          ) : (
            <>
              <Step n={1}>Tap <b>Continue to {app.name}</b>.</Step>
              <Step n={2}>
                Your browser can't install apps automatically. Use its menu and look for <b>Add to Home Screen</b> or <b>Install</b>, or open
                the link in Chrome or Edge.
              </Step>
            </>
          )}
        </ol>

        {!handedOff ? (
          <Button size="lg" className="w-full" onClick={continueToApp}>
            Continue to {app.name} <ExternalLink />
          </Button>
        ) : confirmed ? (
          <p className="flex items-center gap-2 rounded-md bg-secondary p-3 text-sm">
            <CheckCircle2 className="size-4 text-success" /> Marked as installed in My Apps.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">Finished installing on the other tab?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={continueToApp}>Open again</Button>
              <Button onClick={confirm}>Yes, it's installed</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-charcoal text-xs font-semibold text-charcoal-foreground">{n}</span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
