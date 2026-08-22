import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export async function signedUrl(bucket: string, path: string): Promise<string | null> {
  const key = `${bucket}/${path}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 6);
  if (!data?.signedUrl) return null;
  cache.set(key, data.signedUrl);
  return data.signedUrl;
}

export async function signedUrls(bucket: string, paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  const out: Record<string, string> = {};
  const missing: string[] = [];

  for (const p of unique) {
    const cached = cache.get(`${bucket}/${p}`);
    if (cached) out[p] = cached;
    else missing.push(p);
  }

  if (missing.length) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(missing, 60 * 60 * 6);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) {
        out[item.path] = item.signedUrl;
        cache.set(`${bucket}/${item.path}`, item.signedUrl);
      }
    }
  }

  return out;
}
