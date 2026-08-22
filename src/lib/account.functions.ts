import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: files } = await supabaseAdmin.storage.from("photos").list(userId);
    if (files?.length) {
      await supabaseAdmin.storage.from("photos").remove(files.map((f) => `${userId}/${f.name}`));
    }
    const { data: avatars } = await supabaseAdmin.storage.from("avatars").list(userId);
    if (avatars?.length) {
      await supabaseAdmin.storage.from("avatars").remove(avatars.map((f) => `${userId}/${f.name}`));
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });
