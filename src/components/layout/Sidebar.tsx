"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart2,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Shield,
  SlidersHorizontal,
  User,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, KarigaiLogo } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar.store";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

const primaryItems: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Setup", href: "/app/setup", icon: SlidersHorizontal, badge: "0%" },
  { label: "Analysis", href: "/app/analysis", icon: BarChart2 },
  { label: "Cycle Tracker", href: "/app/cycle", icon: Moon },
  { label: "Meals & Nutrition", href: "/app/meals", icon: UtensilsCrossed },
  { label: "Workout", href: "/app/workout", icon: Dumbbell },
  { label: "Chat", href: "/app/chat", icon: MessageCircle },
];

const secondaryItems: NavItem[] = [
  { label: "Profile", href: "/app/profile", icon: User },
  { label: "Privacy", href: "/app/privacy", icon: Shield },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex h-11 items-center gap-3 border-l-2 px-5 font-body text-sm transition md:justify-center md:px-0 lg:justify-start lg:px-5",
        active
          ? "border-clay bg-claySoft/30 text-clay"
          : "border-transparent text-muted hover:bg-shell hover:text-ink2",
      )}
      title={item.label}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="md:hidden lg:inline">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded-chip bg-shell px-2 py-0.5 font-mono text-[10px] text-muted md:hidden lg:inline">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { isOpen, toggle, close } = useSidebarStore();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    close();
    router.push("/");
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className="fixed left-4 top-4 z-50 grid size-10 place-items-center rounded-xl border border-hairline bg-card text-ink shadow-sm md:hidden"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-ink/30 transition md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-hairline bg-card transition-transform md:static md:w-20 md:translate-x-0 lg:w-[260px]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-24 items-center px-6 md:justify-center md:px-0 lg:justify-start lg:px-6">
          <div className="hidden lg:block">
            <KarigaiLogo size={20} tagline />
          </div>
          <div className="lg:hidden">
            <Badge variant="default">K</Badge>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {primaryItems.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={close} />
          ))}

          <div className="my-4 h-px bg-hairline" />

          {secondaryItems.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={close} />
          ))}

          <div className="my-4 h-px bg-hairline" />

          <button
            type="button"
            onClick={signOut}
            className="flex h-11 w-full items-center gap-3 border-l-2 border-transparent px-5 font-body text-sm text-muted transition hover:bg-shell hover:text-ink2 md:justify-center md:px-0 lg:justify-start lg:px-5"
            title="Sign out"
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span className="md:hidden lg:inline">Sign out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
