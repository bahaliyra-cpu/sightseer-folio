import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/account.functions";
import { useAuth } from "@/lib/auth";

export function SettingsDialog({
  open,
  onOpenChange,
  onSwitchAccount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchAccount: () => void;
}) {
  const { user, profile, avatarUrl, refreshProfile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (profileError) throw profileError;
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleUsername() {
    if (!user || !username.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Username updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update username");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteMyAccount();
      await supabase.auth.signOut();
      queryClient.clear();
      onOpenChange(false);
      toast.success("Account deleted");
      await router.navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-8">
        <DialogTitle className="font-display text-3xl font-medium tracking-tight">Settings</DialogTitle>

        <div className="space-y-7">
          <section className="space-y-3">
            <p className="label-caps">Profile picture</p>
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border border-border">
                <AvatarImage src={avatarUrl ?? undefined} alt={profile?.username ?? "avatar"} />
                <AvatarFallback className="bg-secondary font-display text-xl">
                  {(profile?.username ?? "T").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                  Change photo
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatar}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <Label htmlFor="settings-username" className="label-caps">
              Username
            </Label>
            <div className="flex gap-2">
              <Input
                id="settings-username"
                value={username}
                maxLength={40}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button onClick={handleUsername} disabled={busy || !username.trim()}>
                Save
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <p className="label-caps">Manage accounts</p>
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-sm font-medium">{profile?.username ?? "Traveller"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  onOpenChange(false);
                  onSwitchAccount();
                }}
              >
                Switch account
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  onOpenChange(false);
                  onSwitchAccount();
                }}
              >
                Add another account
              </Button>
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            {confirmDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This permanently removes your account, photos and profile. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" disabled={busy} onClick={handleDelete}>
                    Yes, delete everything
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Delete this account
              </Button>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
