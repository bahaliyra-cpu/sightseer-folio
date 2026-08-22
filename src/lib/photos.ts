import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { signedUrls } from "@/lib/storage";

export type PhotoRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  image_url: string;
  storage_path: string | null;
  created_at: string;
};

export type Photo = PhotoRow & {
  url: string | null;
  author: { username: string; avatarUrl: string | null };
};

async function fetchPhotos(userId?: string): Promise<Photo[]> {
  let query = supabase
    .from("photos")
    .select("id, user_id, title, description, location, image_url, storage_path, created_at")
    .order("created_at", { ascending: false });

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as PhotoRow[];
  if (!rows.length) return [];

  const authorIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", authorIds);

  const photoUrls = await signedUrls(
    "photos",
    rows.map((r) => r.storage_path ?? r.image_url),
  );
  const avatarUrls = await signedUrls(
    "avatars",
    (profiles ?? []).map((p) => p.avatar_url).filter(Boolean) as string[],
  );

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const path = row.storage_path ?? row.image_url;
    return {
      ...row,
      url: photoUrls[path] ?? null,
      author: {
        username: profile?.username ?? "Traveller",
        avatarUrl: profile?.avatar_url ? (avatarUrls[profile.avatar_url] ?? null) : null,
      },
    };
  });
}

export const photosQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["photos", userId ?? "all"],
    queryFn: () => fetchPhotos(userId),
    staleTime: 30_000,
  });

export function matchesSearch(photo: Photo, term: string) {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return [photo.title, photo.description, photo.location, photo.author.username]
    .filter(Boolean)
    .some((field) => (field as string).toLowerCase().includes(q));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
