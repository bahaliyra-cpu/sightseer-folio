import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload a Photo — Wanderlight" },
      {
        name: "description",
        content: "Share a travel photograph with a title, story and the place it was taken.",
      },
      { property: "og:title", content: "Upload a Photo — Wanderlight" },
      { property: "og:description", content: "Share a travel photograph on Wanderlight." },
    ],
  }),
  component: Upload,
});

function Upload() {
  const { user, loading } = useAuth();
  const { openAuth } = useShell();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) openAuth("login");
  }, [loading, user, openAuth]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return openAuth("login");
    if (!files.length) return toast.error("Choose at least one image");
    if (!title.trim()) return toast.error("Give it a title");

    setBusy(true);
    try {
      for (const [index, file] of files.entries()) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("photos").upload(path, file);
        if (upErr) throw upErr;

        const { error } = await supabase.from("photos").insert({
          user_id: user.id,
          title: files.length > 1 ? `${title.trim()} (${index + 1})` : title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          image_url: path,
          storage_path: path,
        });
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast.success(files.length > 1 ? "Photos shared" : "Photo shared");
      setFiles([]);
      setTitle("");
      setDescription("");
      setLocation("");
      void navigate({ to: "/my-gallery" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24">
      <header className="rise-in py-20 text-center">
        <p className="label-caps text-primary">Add to the archive</p>
        <h1 className="mt-4 font-display text-6xl font-medium leading-[1.05] tracking-tight md:text-7xl">
          Upload
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
          One photograph or many — give them a title, a story and a place.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-border bg-card p-8">
        <div className="space-y-3">
          <Label htmlFor="files">Images</Label>
          <label
            htmlFor="files"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/40 py-14 text-center transition-colors hover:bg-secondary"
          >
            <ImagePlus className="size-7 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to choose one or more images
            </span>
          </label>
          <input
            id="files"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />

          {files.length > 0 && (
            <ul className="space-y-2 pt-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, index) => index !== i))}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning over the fjord" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lofoten, Norway" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened there?"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Sharing…" : "Share to gallery"}
        </Button>
      </form>
    </div>
  );
}
