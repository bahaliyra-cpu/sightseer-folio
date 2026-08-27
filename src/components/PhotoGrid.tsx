import { MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, type Photo } from "@/lib/photos";

export function PhotoGrid({
  photos,
  showAuthor = true,
  onSelect,
}: {
  photos: Photo[];
  showAuthor?: boolean;
  onSelect: (photo: Photo) => void;
}) {
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          onClick={() => onSelect(photo)}
          style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
          className="rise-in group block w-full break-inside-avoid overflow-hidden rounded-xl border border-border/70 bg-card text-left transition-shadow hover:shadow-xl"
        >
          <div className="overflow-hidden bg-secondary">
            {photo.url ? (
              <img
                src={photo.url}
                alt={photo.title}
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="aspect-[4/3] w-full animate-pulse bg-secondary" />
            )}
          </div>

          <div className="space-y-2 p-5">
            <h3 className="font-display text-xl font-medium leading-snug tracking-tight">
              {photo.title}
            </h3>

            {photo.location && (
              <p className="inline-flex items-center gap-1.5 text-xs text-primary">
                <MapPin className="size-3.5" />
                {photo.location}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              {showAuthor ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={photo.author.avatarUrl ?? undefined} alt={photo.author.username} />
                    <AvatarFallback className="bg-secondary text-[10px]">
                      {photo.author.username.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{photo.author.username}</span>
                </div>
              ) : (
                <span />
              )}
              <span className="label-caps text-muted-foreground">{formatDate(photo.created_at)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
