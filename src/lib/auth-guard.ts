"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuthModalStore } from "@/store/auth-modal.store";

export async function ensureAuthenticated(mode: "login" | "signup" = "signup") {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    useAuthModalStore.getState().openModal(mode);
    return false;
  }

  return true;
}
