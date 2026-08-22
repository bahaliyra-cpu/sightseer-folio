import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "signup" | "forgot";

export function AuthDialog({
  open,
  onOpenChange,
  initialMode = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const mismatch = mode === "signup" && confirm.length > 0 && password !== confirm;
  const matched = mode === "signup" && confirm.length > 0 && password === confirm;

  function reset(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirm("");
    setSent(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        onOpenChange(false);
      } else if (mode === "signup") {
        if (password !== confirm) {
          toast.error("Passwords do not match");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          onOpenChange(false);
        } else {
          setSent("Check your inbox and confirm your email to finish signing up.");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("We sent a reset link to your email. Your username is shown in Settings once you are back in.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    onOpenChange(false);
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Start your journal" : "Reset access";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border bg-card p-8">
        <DialogTitle className="font-display text-3xl font-medium tracking-tight">{title}</DialogTitle>
        <p className="-mt-2 text-sm text-muted-foreground">
          {mode === "forgot"
            ? "Enter your email and we'll send a link to set a new password."
            : "Collect the places you've been, in one quiet gallery."}
        </p>

        {sent ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">{sent}</p>
            <Button variant="outline" className="w-full" onClick={() => reset("login")}>
              Back to log in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-username" className="label-caps">
                  Username
                </Label>
                <Input
                  id="auth-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="wandering.ren"
                  maxLength={40}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="label-caps">
                Email
              </Label>
              <Input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-password" className="label-caps">
                  Password
                </Label>
                <Input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="auth-confirm" className="label-caps">
                  Confirm password
                </Label>
                <Input
                  id="auth-confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={mismatch}
                />
                {mismatch && <p className="text-xs text-destructive">Passwords don't match yet.</p>}
                {matched && <p className="text-xs text-primary">Passwords match.</p>}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy || mismatch}>
              {mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>

            {mode !== "forgot" && (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="label-caps">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                  Continue with Google
                </Button>
              </>
            )}
          </form>
        )}

        {!sent && (
          <div className="flex items-center justify-between pt-1 text-sm">
            {mode === "login" ? (
              <>
                <button type="button" className="text-primary hover:underline" onClick={() => reset("forgot")}>
                  Forgot username or password?
                </button>
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => reset("signup")}>
                  Sign up
                </button>
              </>
            ) : (
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => reset("login")}>
                Back to log in
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
