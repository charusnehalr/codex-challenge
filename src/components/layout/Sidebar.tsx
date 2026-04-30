"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart2,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Shield,
  SlidersHorizontal,
  User,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, KarigaiLogo } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { slideInLeft, staggerContainer } from "@/lib/animations";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";
import { useSidebarStore } from "@/store/sidebar.store";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
};

function primaryItems(setupProgress: number | null): NavItem[] {
  return [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Onboarding", href: "/app/setup", icon: SlidersHorizontal, badge: setupProgress === null ? null : `${setupProgress}%` },
  { label: "Analysis", href: "/app/analysis", icon: BarChart2 },
  { label: "Cycle Tracker", href: "/app/cycle", icon: Moon },
  { label: "Meals & Nutrition", href: "/app/meals", icon: UtensilsCrossed },
  { label: "Workout", href: "/app/workout", icon: Dumbbell },
  { label: "Chat", href: "/app/chat", icon: MessageCircle },
  ];
}

const secondaryItems: NavItem[] = [
  { label: "Profile", href: "/app/profile", icon: User },
  { label: "Privacy", href: "/app/privacy", icon: Shield },
];

async function fetchSetupProgress() {
  const response = await fetch("/api/setup/progress", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to load onboarding progress.");
  }
  return (await response.json()) as { setupProgress: number };
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <motion.div variants={slideInLeft}>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group relative flex min-h-[38px] items-center gap-2 overflow-hidden px-4 pl-4 font-body text-xs font-medium transition-all duration-150 md:justify-center md:px-0 lg:justify-start lg:px-4 lg:pl-4",
          active
            ? "bg-gradient-to-r from-claySoft/40 to-transparent text-clay"
            : "text-muted hover:bg-shell/70 hover:text-ink2",
        )}
        title={item.label}
      >
        {active ? (
          <motion.span
            layoutId="active-nav-indicator"
            className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-clay"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        ) : null}
        <Icon className={cn("size-4 shrink-0", active ? "stroke-clay" : "stroke-current")} aria-hidden="true" />
        <span className="md:hidden lg:inline transition-transform duration-150 group-hover:translate-x-1">{item.label}</span>
        {item.badge ? (
          <span className="ml-auto rounded-chip bg-shell px-2 py-0.5 font-mono text-[10px] text-muted md:hidden lg:inline">
            {item.badge}
          </span>
        ) : null}
      </Link>
    </motion.div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const { isOpen, close } = useSidebarStore();
  const { user, isAuthenticated, isLoading } = useAuth();
  const openModal = useAuthModalStore((state) => state.openModal);
  const { data: progressData } = useQuery({
    queryKey: ["setupProgress", user?.id ?? "guest"],
    queryFn: fetchSetupProgress,
  });
  const navItems = primaryItems(progressData?.setupProgress ?? 0);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    close();
    router.push("/");
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-ink/30 transition md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={close}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-shrink-0 flex-col border-r border-hairline bg-card shadow-[2px_0_16px_rgba(31,27,22,0.04)] transition-transform md:static md:w-20 md:translate-x-0 lg:w-[240px]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        data-cursor-precise
      >
        <div className="border-b border-hairline px-4 pb-4 pt-5 md:px-0 lg:px-4">
          <div className="flex items-center md:justify-center lg:justify-start">
          <div className="hidden lg:block">
            <KarigaiLogo size={20} tagline />
          </div>
          <div className="lg:hidden">
            <Badge variant="default">K</Badge>
          </div>
          </div>
        </div>

        <motion.nav className="flex-1 space-y-1 py-4" variants={staggerContainer} initial="hidden" animate="visible">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={close} />
          ))}

          <div className="my-4 h-px bg-hairline" />

          {secondaryItems.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={close} />
          ))}

          <div className="my-4 h-px bg-hairline" />

          {!isLoading && isAuthenticated ? (
            <button
              type="button"
              onClick={signOut}
              className="group flex min-h-[38px] w-full items-center gap-2 border-l-2 border-transparent px-4 font-body text-xs font-medium text-muted transition-all duration-150 hover:bg-shell/70 hover:text-ink2 md:justify-center md:px-0 lg:justify-start lg:px-4"
              title="Sign out"
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              <span className="md:hidden lg:inline transition-transform duration-150 group-hover:translate-x-1">Sign out</span>
            </button>
          ) : (
            <div className="px-4 md:px-3 lg:px-4">
            <Button
              onClick={() => {
                close();
                openModal("login");
              }}
              className="w-full"
              size="md"
              variant="accent"
              title="Sign in"
            >
              <User className="size-4 shrink-0" aria-hidden="true" />
              <span className="md:hidden lg:inline">Sign in</span>
            </Button>
            </div>
          )}
        </motion.nav>
      </aside>
    </>
  );
}
