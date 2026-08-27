import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Input } from "@/components/ui/input";
import { matchesSearch, photosQuery, type Photo } from "@/lib/photos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wanderlight — A Travel Photo Journal" },
      {
        name: "description",
        content:
          "Browse travel photographs shared by wanderers around the world. Search by place, title or story.",
      },
      { property: "og:title", content: "Wanderlight — A Travel Photo Journal" },
      {
        property: "og:description",
        content: "Browse travel photographs shared by wanderers around the world.",
      },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const { data, isLoading } = useQuery(photosQuery());
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Photo | null>(null);

  const photos = useMemo(() => (data ?? []).filter((p) => matchesSearch(p, term)), [data, term]);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24">
      <header className="rise-in py-20 text-center">
        <p className="label-caps text-primary">The collective journal</p>
        <h1 className="mt-4 font-display text-6xl font-medium leading-[1.05] tracking-tight md:text-7xl">
          Gallery
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          Photographs gathered from travellers everywhere — a slow, wandering archive of light,
          places and the stories behind them.
        </p>

        <div className="relative mx-auto mt-10 max-w-md">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search locations, titles, stories…"
            className="h-12 rounded-full pl-11"
            aria-label="Search photos"
          />
        </div>
      </header>

      {isLoading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">Loading the archive…</p>
      ) : photos.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          Nothing here yet — be the first to share a place.
        </p>
      ) : (
        <PhotoGrid photos={photos} onSelect={setSelected} />
      )}

      <PhotoLightbox photo={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
