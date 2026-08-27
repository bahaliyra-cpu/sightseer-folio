import { supabase } from "@/integrations/supabase/client";
import type { Photo } from "@/lib/photos";

export async function deletePhoto(photo: Photo) {
  if (photo.storage_path) {
    await supabase.storage.from("photos").remove([photo.storage_path]);
  }
  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) throw error;
}
