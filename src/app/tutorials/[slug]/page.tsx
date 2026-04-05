"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  ComponentType,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Construction,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LEVEL_ACCENT,
  LEVEL_LABELS,
  getAdjacentTutorials,
  getTutorialBySlug,
  isTutorialReady,
} from "@/content/tutorials";
import { cn } from "@/lib/utils";

const PROGRESS_KEY = "practiceql.tutorials.progress";

type ProgressMap = Record<string, boolean>;

function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as ProgressMap;
  } catch {
    return {};
  }
}

function writeProgress(p: ProgressMap) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export default function TutorialViewerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const entry = slug ? getTutorialBySlug(slug) : undefined;

  if (!entry) {
    notFound();
  }

  const { prev, next } = getAdjacentTutorials(entry.slug);
  const ready = isTutorialReady(entry);

  const LazyContent = useMemo<ComponentType | null>(() => {
    if (!entry.load) return null;
    return lazy(entry.load);
  }, [entry]);

  const [progress, setProgress] = useState<ProgressMap>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setProgress(readProgress());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const next = { ...progress, [`${entry.slug}:visited`]: true };
    writeProgress(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.slug, mounted]);

  const isCompleted = !!progress[entry.slug];

  const toggleComplete = () => {
    const nextMap = { ...progress, [entry.slug]: !isCompleted };
    setProgress(nextMap);
    writeProgress(nextMap);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b bg-muted/20">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            All tutorials
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge
              variant="outline"
              className={cn("text-[11px]", LEVEL_ACCENT[entry.level])}
            >
              {LEVEL_LABELS[entry.level]}
            </Badge>
            {entry.concepts.slice(0, 3).map((c) => (
              <span
                key={c}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {entry.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {entry.description}
          </p>
        </div>
      </div>

      <div className="flex-1">
        {ready && LazyContent ? (
          <Suspense
            fallback={
              <div className="max-w-3xl mx-auto px-6 py-12 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading lesson…
              </div>
            }
          >
            <LazyContent />
          </Suspense>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-16">
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Construction className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold">Lesson coming soon</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                This tutorial is being authored. The concepts below will be
                covered with interactive SQL blocks and diagrams.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {entry.concepts.map((c) => (
                  <Badge key={c} variant="outline" className="text-[11px]">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t">
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button
            variant={isCompleted ? "secondary" : "default"}
            size="sm"
            onClick={toggleComplete}
            className="gap-2"
            disabled={!ready}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Completed
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                Mark complete
              </>
            )}
          </Button>
          <div className="flex-1" />
          <div className="flex gap-2">
            {prev ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/tutorials/${prev.slug}`} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="truncate max-w-[180px]">{prev.title}</span>
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {next && (
              <Button size="sm" asChild>
                <Link href={`/tutorials/${next.slug}`} className="gap-2">
                  <span className="truncate max-w-[180px]">{next.title}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
