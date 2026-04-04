"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { getChallengeById, getAdjacentChallenges } from "@/content/challenges";
import { ChallengeWorkspace } from "@/components/challenges/challenge-workspace";
import { useProgressStore } from "@/stores/progress-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const challenge = getChallengeById(id);
  const loadProgress = useProgressStore((s) => s.loadProgress);
  const loaded = useProgressStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) loadProgress();
  }, [loaded, loadProgress]);

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Challenge not found: &quot;{id}&quot;</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/challenges">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Challenges
          </Link>
        </Button>
      </div>
    );
  }

  const { prev, next } = getAdjacentChallenges(id);

  return (
    <div className="flex flex-col h-full">
      {/* Nav bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30 shrink-0">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Link href="/challenges">
            <ArrowLeft className="h-3 w-3" />
            Challenges
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs font-medium truncate">{challenge.title}</span>
        <div className="flex-1" />
        {prev && (
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Link href={`/challenges/${prev.id}`}>
              <ChevronLeft className="h-3 w-3" />
              Prev
            </Link>
          </Button>
        )}
        {next && (
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Link href={`/challenges/${next.id}`}>
              Next
              <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      {/* Workspace */}
      <div className="flex-1 min-h-0">
        <ChallengeWorkspace key={id} challenge={challenge} />
      </div>
    </div>
  );
}
