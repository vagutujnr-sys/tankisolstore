import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TankiSol" },
      { name: "description", content: "Sign in or create your TankiSol account." },
      { property: "og:title", content: "Sign in — TankiSol" },
      { property: "og:description", content: "Sign in or create your TankiSol account." },
    ],
  }),
  component: AuthPage,
});

export function AuthForm({ onDone, allowSignup = true }: { onDone: () => void; allowSignup?: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password") ?? "");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onDone();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: String(f.get("name") || "") } },
        });
        if (error) throw error;
        if (data.session) onDone();
        else setSent("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <p className="rounded-md bg-secondary p-4 text-sm">{sent}</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      {mode === "signup" && (
        <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" name="name" /></div>
      )}
      <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
      {mode !== "forgot" && (
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </div>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
      </Button>
      <div className="flex justify-between text-sm">
        {mode !== "forgot" ? (
          <button type="button" className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
        ) : (
          <button type="button" className="text-muted-foreground" onClick={() => setMode("signin")}>Back to sign in</button>
        )}
        {allowSignup && mode !== "forgot" && (
          <button type="button" className="font-medium text-primary" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create account" : "I have an account"}
          </button>
        )}
      </div>
    </form>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-1 text-2xl font-semibold">Welcome to TankiSol</h1>
      <p className="mb-6 text-sm text-muted-foreground">Save apps, track installs and keep favourites.</p>
      <AuthForm onDone={() => navigate({ to: "/my-apps" })} />
    </div>
  );
}
