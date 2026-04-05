"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Filter,
  KeySquare,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CATEGORY_DESCRIPTION,
  CATEGORY_LABEL,
  KeywordCategory,
  KeywordEntry,
  ReservedStatus,
  SQL_KEYWORDS,
} from "@/content/sql-keywords";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as KeywordCategory[];

const CATEGORY_TINT: Record<KeywordCategory, string> = {
  dml: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  ddl: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  dcl: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  tcl: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  clause: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  operator: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
  datatype: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  function: "bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/25",
  constraint: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25",
  join: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25",
  literal: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25",
  meta: "bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/25",
};

const ENGINE_LABEL: Record<string, string> = {
  standard: "ANSI",
  sqlite: "SQLite",
  postgres: "Postgres",
  mysql: "MySQL",
  oracle: "Oracle",
  mssql: "SQL Server",
};

const RESERVED_TINT: Record<ReservedStatus, string> = {
  reserved: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
  "non-reserved":
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  mixed: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
};

function matches(entry: KeywordEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (entry.keyword.toLowerCase().includes(q)) return true;
  if (entry.summary.toLowerCase().includes(q)) return true;
  if (entry.syntax && entry.syntax.toLowerCase().includes(q)) return true;
  if (entry.example && entry.example.toLowerCase().includes(q)) return true;
  if (entry.notes && entry.notes.toLowerCase().includes(q)) return true;
  if (entry.related && entry.related.some((r) => r.toLowerCase().includes(q)))
    return true;
  return false;
}

export default function KeywordsReferencePage() {
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<KeywordCategory>>(new Set());
  const [reservedOnly, setReservedOnly] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const filtered = useMemo(() => {
    return SQL_KEYWORDS.filter((k) => {
      if (activeCats.size > 0 && !activeCats.has(k.category)) return false;
      if (reservedOnly && k.reserved !== "reserved") return false;
      return matches(k, query);
    });
  }, [query, activeCats, reservedOnly]);

  const grouped = useMemo(() => {
    const map = new Map<KeywordCategory, KeywordEntry[]>();
    for (const k of filtered) {
      const arr = map.get(k.category) ?? [];
      arr.push(k);
      map.set(k.category, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.keyword.localeCompare(b.keyword));
    }
    return Array.from(map.entries()).sort(
      (a, b) =>
        ALL_CATEGORIES.indexOf(a[0]) - ALL_CATEGORIES.indexOf(b[0]),
    );
  }, [filtered]);

  const toggleCategory = (c: KeywordCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCats(new Set());
    setReservedOnly(false);
  };

  const hasFilters = query || activeCats.size > 0 || reservedOnly;
  const reservedCount = SQL_KEYWORDS.filter((k) => k.reserved === "reserved").length;

  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            All tutorials
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <KeySquare className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Reference
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            SQL Keywords
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-3xl">
            There&apos;s no fixed number of SQL keywords - core ANSI SQL defines around
            200–300, and every engine adds more. Below are the keywords you&apos;ll
            actually meet in the wild, grouped by purpose, with syntax, examples, and
            which engines support them.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-5 text-xs">
            <Badge variant="secondary" className="gap-1.5">
              <Layers className="h-3 w-3 text-primary" />
              {SQL_KEYWORDS.length} keywords
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="h-3 w-3 text-rose-500" />
              {reservedCount} reserved
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              {ALL_CATEGORIES.length} categories
            </Badge>
          </div>
        </div>
      </div>

      <div className="border-b bg-background sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 space-y-3">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SELECT, JOIN, COALESCE…"
                className="pl-9 h-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant={reservedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setReservedOnly((v) => !v)}
              className="gap-1.5 h-9"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Reserved only
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 h-9 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-1.5 pb-1">
              {ALL_CATEGORIES.map((cat) => {
                const count = SQL_KEYWORDS.filter(
                  (k) => k.category === cat,
                ).length;
                const active = activeCats.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors",
                      active
                        ? CATEGORY_TINT[cat] + " font-medium"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    {CATEGORY_LABEL[cat]}{" "}
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8 w-full">
        {filtered.length === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center gap-3">
              <Filter className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-semibold">No keywords match</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different term or clear the filters.
                </p>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {grouped.map(([category, items]) => (
          <section key={category} id={`cat-${category}`}>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider",
                      CATEGORY_TINT[category],
                    )}
                  >
                    {CATEGORY_LABEL[category]}
                  </span>
                  <span className="text-muted-foreground text-xs font-normal">
                    {items.length} keyword{items.length === 1 ? "" : "s"}
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
                  {CATEGORY_DESCRIPTION[category]}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((k) => (
                <KeywordCard key={k.keyword} entry={k} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function KeywordCard({ entry }: { entry: KeywordEntry }) {
  return (
    <Card
      id={entry.keyword.toLowerCase().replace(/\s+/g, "-")}
      className="h-full flex flex-col"
    >
      <CardContent className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <code className="font-mono text-sm font-semibold text-foreground">
            {entry.keyword}
          </code>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-normal shrink-0",
              RESERVED_TINT[entry.reserved],
            )}
          >
            {entry.reserved}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {entry.summary}
        </p>

        {entry.syntax && (
          <div className="rounded-md border bg-muted/40 px-2.5 py-1.5 font-mono text-[11px] overflow-x-auto">
            {entry.syntax}
          </div>
        )}

        {entry.example && (
          <pre className="rounded-md border bg-muted/20 px-2.5 py-1.5 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
            {entry.example}
          </pre>
        )}

        {entry.notes && (
          <p className="text-[11px] text-muted-foreground italic leading-relaxed border-l-2 border-primary/40 pl-2">
            {entry.notes}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          {entry.engines.map((eng) => (
            <span
              key={eng}
              className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
            >
              {ENGINE_LABEL[eng] ?? eng}
            </span>
          ))}
        </div>

        {entry.related && entry.related.length > 0 && (
          <div className="flex flex-wrap gap-1 text-[10px] pt-1 border-t">
            <span className="text-muted-foreground">See also:</span>
            {entry.related.map((r) => (
              <code key={r} className="text-primary font-mono">
                {r}
              </code>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
