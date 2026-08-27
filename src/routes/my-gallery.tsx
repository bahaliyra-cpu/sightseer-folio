import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useShell } from "@/components/AppShell";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { deletePhoto } from "@/lib/photo-actions";
import { matchesSearch, photosQuery, type Photo } from "@/lib/photos";

export const Route = createFileRoute("/my-gallery")({
  head: () => ({
    meta: [
      { title: "My Gallery — Wanderlight" },
      {
        name: "description",
        content: "Your own travel photographs on Wanderlight — search, revisit and curate them.",
      },
      { property: "og:title", content: "My Gallery — Wanderlight" },
      { property: "og:description", content: "Your own travel photographs on Wanderlight." },
    ],
  }),
  component: MyGallery,
});

function MyGallery() {
  const { user, loading } = useAuth();
  const { openAuth } = useShell();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ ...photosQuery(user?.id), enabled: !!user });
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Photo | null>(null);

  useEffect(() => {
    if (!loading && !user) openAuth("login");
  }, [loading, user, openAuth]);

  const photos = useMemo(() => (data ?? []).filter((p) => matchesSearch(p, term)), [data, term]);

  async function handleDelete(photo: Photo) {
    try {
      await deletePhoto(photo);
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["photos"] });
      toast.success("Photo deleted");
    } catch {
      toast.error("Could not delete that photo");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24">
      <header className="rise-in py-20 text-center">
        <p className="label-caps text-primary">Your own archive</p>
        <h1 className="mt-4 font-display text-6xl font-medium leading-[1.05] tracking-tight md:text-7xl">
          My Gallery
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Everything you've shared, kept in one quiet place.
        </p>

        <div className="relative mx-auto mt-10 max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search your locations, titles, stories…"
            className="h-12 rounded-full pl-11"
            aria-label="Search your photos"
          />
        </div>
      </header>

      {!user ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Log in to see your gallery.
        </p>
      ) : isLoading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Loading your archive…</p>
      ) : photos.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          You haven't shared anything yet.
        </p>
      ) : (
        <PhotoGrid photos={photos} showAuthor={false} onSelect={setSelected} />
      )}

      <PhotoLightbox
        photo={selected}
        showAuthor={false}
        onClose={() => setSelected(null)}
        onDelete={(p) => void handleDelete(p)}
      />
    </div>
  );
}
