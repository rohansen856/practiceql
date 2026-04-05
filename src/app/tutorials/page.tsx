"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Construction,
  KeySquare,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LEVEL_ACCENT,
  LEVEL_DESCRIPTIONS,
  LEVEL_LABELS,
  LEVEL_ORDER,
  TUTORIALS,
  getTutorialsByLevel,
  isTutorialReady,
} from "@/content/tutorials";
import { SQL_KEYWORDS } from "@/content/sql-keywords";
import { cn } from "@/lib/utils";

type ProgressMap = Record<string, boolean>;

const PROGRESS_KEY = "practiceql.tutorials.progress";

function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

export default function TutorialsPage() {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    setProgress(readProgress());
  }, []);

  const totalReady = TUTORIALS.filter(isTutorialReady).length;
  const completed = Object.values(progress).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Structured Learning Path
          </p>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Tutorials</h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          From your first <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[0.85em]">SELECT</code>{" "}
          to window functions, recursive CTEs, and query tuning - every lesson is
          interactive and runs SQL right in your browser.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-5 text-sm">
          <Badge variant="secondary" className="gap-1.5">
            <Layers className="h-3 w-3 text-primary" />
            {TUTORIALS.length} tutorials
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {completed} completed
          </Badge>
          {TUTORIALS.length - totalReady > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <Construction className="h-3 w-3 text-amber-500" />
              {TUTORIALS.length - totalReady} in progress
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5">
            <KeySquare className="h-3 w-3 text-primary" />
            {SQL_KEYWORDS.length} keywords reference
          </Badge>
        </div>
      </header>

      <Link
        href="/tutorials/reference/keywords"
        className="block mb-10 group"
      >
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background transition-colors hover:border-primary/60">
          <CardContent className="flex items-center gap-5 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <KeySquare className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 className="text-base font-semibold">SQL Keywords Reference</h3>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  Searchable
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every SQL keyword you&apos;ll meet - SELECT, JOIN, WINDOW, CTE,
                PRAGMA - with syntax, examples, reserved status, and engine
                support across SQLite, Postgres, MySQL, and more.
              </p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </CardContent>
        </Card>
      </Link>

      <div className="space-y-10">
        {LEVEL_ORDER.map((level) => {
          const items = getTutorialsByLevel(level);
          return (
            <section key={level}>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight flex items-center gap-3">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        LEVEL_ACCENT[level]
                      )}
                    >
                      {LEVEL_LABELS[level]}
                    </span>
                    <span>{LEVEL_LABELS[level]} Track</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    {LEVEL_DESCRIPTIONS[level]}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {items.filter(isTutorialReady).length}/{items.length} ready
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((t, i) => {
                  const ready = isTutorialReady(t);
                  const isDone = !!progress[t.slug];
                  const inner = (
                    <Card
                      className={cn(
                        "h-full transition-colors",
                        ready
                          ? "hover:border-primary/40 cursor-pointer"
                          : "opacity-70"
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shrink-0 transition-colors",
                              isDone
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                : ready
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-muted/50 border-dashed border-border text-muted-foreground"
                            )}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : ready ? (
                              i + 1
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-[15px] leading-tight">
                                {t.title}
                              </h3>
                              {!ready && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-normal gap-1"
                                >
                                  <Construction className="h-2.5 w-2.5" />
                                  Soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                              {t.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {t.concepts.slice(0, 4).map((c) => (
                                <span
                                  key={c}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/70 text-muted-foreground"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  return ready ? (
                    <Link key={t.slug} href={`/tutorials/${t.slug}`}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={t.slug}>{inner}</div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
