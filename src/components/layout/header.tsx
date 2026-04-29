"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { EngineSwitcher } from "./engine-switcher";

const SEGMENT_LABELS: Record<string, string> = {
  "": "Home",
  playground: "Playground",
  tutorials: "Tutorials",
  challenges: "Challenges",
  "schema-builder": "Schema Builder",
  visualization: "Visualization",
  developers: "Developers",
  settings: "Settings",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ href: "/", label: "Home" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    crumbs.push({
      href: acc,
      label: SEGMENT_LABELS[seg] ?? decodeURIComponent(seg),
    });
  }
  return crumbs;
}

export function Header() {
  const crumbs = useBreadcrumbs();

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b bg-background/60 backdrop-blur-sm sticky top-0 z-20">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <span className="text-muted-foreground/60 select-none">/</span>
            )}
            {i === crumbs.length - 1 ? (
              <span className="font-medium truncate">{c.label}</span>
            ) : (
              <Link
                href={c.href}
                className="text-muted-foreground hover:text-foreground truncate"
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <EngineSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
