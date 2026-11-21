import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — TankiSol" },
      { name: "description", content: "Choose a new password for your TankiSol account." },
      { property: "og:title", content: "Reset password — TankiSol" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/profile" });
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-3 py-8">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <Input name="password" type="password" minLength={8} required placeholder="New password" autoComplete="new-password" />
      <Button className="w-full" disabled={busy}>Update password</Button>
    </form>
  );
}
