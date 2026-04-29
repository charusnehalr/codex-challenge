"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User } from "lucide-react";
import { Button, KarigaiLogo } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useSidebarStore } from "@/store/sidebar.store";

export function MobileHeader() {
  const router = useRouter();
  const toggle = useSidebarStore((state) => state.toggle);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-card px-3 md:hidden">
      <Button variant="ghost" size="sm" onClick={toggle} aria-label="Open navigation">
        <Menu className="size-4" />
      </Button>
      <div className="w-10 overflow-hidden">
        <KarigaiLogo size={20} tagline={false} />
      </div>
      <details className="relative">
        <summary className="list-none">
          <span className="flex size-9 cursor-pointer items-center justify-center rounded-chip bg-shell text-muted">
            <User className="size-4" />
          </span>
        </summary>
        <div className="absolute right-0 top-11 z-50 w-44 rounded-card border border-hairline bg-card p-2 shadow-xl">
          <Link className="block rounded-xl px-3 py-2 font-body text-sm text-ink2 hover:bg-shell" href="/app/profile">
            Profile
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="block w-full rounded-xl px-3 py-2 text-left font-body text-sm text-alert hover:bg-shell"
          >
            Sign out
          </button>
        </div>
      </details>
    </header>
  );
}
