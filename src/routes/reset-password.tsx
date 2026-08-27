import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — Wanderlight" },
      { name: "description", content: "Choose a new password for your Wanderlight account." },
      { property: "og:title", content: "Reset Password — Wanderlight" },
      { property: "og:description", content: "Choose a new password for your Wanderlight account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Use at least 6 characters");
      return;
    }
    if (mismatch) {
      toast.error("Passwords don't match");
      return;
    }


    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated");
    void navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-5xl font-medium tracking-tight">Set a new password</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter a new password for your account, then confirm it.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch && <p className="text-xs text-destructive">Passwords don't match</p>}
          {!mismatch && confirm.length > 0 && (
            <p className="text-xs text-primary">Passwords match</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={busy || mismatch}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
