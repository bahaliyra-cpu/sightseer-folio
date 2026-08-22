import { MapPin, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatDate, type Photo } from "@/lib/photos";

export function PhotoLightbox({
  photo,
  onClose,
  showAuthor = true,
  onDelete,
}: {
  photo: Photo | null;
  onClose: () => void;
  showAuthor?: boolean;
  onDelete?: (photo: Photo) => void;
}) {
  return (
    <Dialog open={!!photo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl overflow-hidden rounded-2xl border-border bg-card p-0">
        {photo && (
          <div className="grid gap-0 md:grid-cols-[1.35fr_1fr]">
            <div className="bg-secondary">
              {photo.url && (
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="h-full max-h-[80vh] w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col justify-between gap-8 p-8">
              <div>
                {showAuthor && (
                  <div className="mb-6 flex items-center gap-3">
                    <Avatar className="size-9 border border-border">
                      <AvatarImage src={photo.author.avatarUrl ?? undefined} alt={photo.author.username} />
                      <AvatarFallback className="bg-secondary text-xs">
                        {photo.author.username.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{photo.author.username}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(photo.created_at)}</p>
                    </div>
                  </div>
                )}

                <DialogTitle className="font-display text-4xl font-medium leading-tight tracking-tight">
                  {photo.title}
                </DialogTitle>

                {!showAuthor && (
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(photo.created_at)}</p>
                )}

                {photo.description && (
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{photo.description}</p>
                )}

                {photo.location && (
                  <p className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary">
                    <MapPin className="size-4" />
                    {photo.location}
                  </p>
                )}
              </div>

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit text-destructive hover:text-destructive"
                  onClick={() => onDelete(photo)}
                >
                  <Trash2 className="mr-1.5 size-4" /> Delete photo
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
