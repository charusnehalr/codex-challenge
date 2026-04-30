"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthStateListener() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[Auth] event:", event, "user:", session?.user?.email);
      }

      if (event === "SIGNED_IN") {
        queryClient.clear();
        await queryClient.invalidateQueries();
        router.refresh();
      }

      if (event === "SIGNED_OUT") {
        queryClient.clear();
        router.refresh();
      }

      if (event === "TOKEN_REFRESHED") {
        await queryClient.invalidateQueries();
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, router]);

  return null;
}
