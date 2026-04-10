"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  BookOpen,
  Trophy,
  Database,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    icon: Home,
    label: "Home",
    tint: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/playground",
    icon: Terminal,
    label: "Playground",
    tint: "text-emerald-600 dark:text-emerald-400",
  },
  {
    href: "/tutorials",
    icon: BookOpen,
    label: "Tutorials",
    tint: "text-sky-600 dark:text-sky-400",
  },
  {
    href: "/challenges",
    icon: Trophy,
    label: "Challenges",
    tint: "text-amber-600 dark:text-amber-400",
  },
  {
    href: "/schema-builder",
    icon: Database,
    label: "Schema Builder",
    tint: "text-violet-600 dark:text-violet-400",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    tint: "text-slate-600 dark:text-slate-300",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0",
        sidebarOpen ? "w-56" : "w-14",
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b border-sidebar-border">
        {sidebarOpen && (
          <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/25">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight truncate">
              PracticeQL
            </span>
          </Link>
        )}
        {!sidebarOpen && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/25 mx-auto">
            <Database className="h-4 w-4 text-primary" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? item.tint
                    : cn(item.tint, "opacity-70 group-hover:opacity-100"),
                )}
              />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {sidebarOpen && (
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/60 text-center leading-relaxed">
            Powered by <span className="text-primary font-medium">PracticeQL</span>{" "}
          </p>
        </div>
      )}
    </aside>
  );
}
