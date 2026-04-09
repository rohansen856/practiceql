"use client";

import { useState, useEffect, useMemo } from "react";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { ChallengeFilters } from "@/components/challenges/challenge-filters";
import { challengeSets, allChallenges } from "@/content/challenges";
import { useProgressStore } from "@/stores/progress-store";
import {
  ChallengeCategory,
  Difficulty,
  getChallengeDialects,
} from "@/types/challenge";
import { SqlDialect } from "@/lib/sql/dialect";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, CheckCircle2 } from "lucide-react";

export default function ChallengesPage() {
  const [category, setCategory] = useState<ChallengeCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [dialect, setDialect] = useState<SqlDialect | "all">("all");
  const challengeProgress = useProgressStore((s) => s.challengeProgress);
  const loadProgress = useProgressStore((s) => s.loadProgress);
  const loaded = useProgressStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) loadProgress();
  }, [loaded, loadProgress]);

  const filtered = useMemo(() => {
    return allChallenges.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (difficulty !== "all" && c.difficulty !== difficulty) return false;
      if (dialect !== "all" && !getChallengeDialects(c).includes(dialect))
        return false;
      return true;
    });
  }, [category, difficulty, dialect]);

  const completedCount = Object.values(challengeProgress).filter((p) => p.completed).length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/25">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Test your SQL skills with {allChallenges.length} challenges
                across {challengeSets.length} categories
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="gap-1.5 shrink-0 border-primary/20 bg-primary/5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {completedCount}/{allChallenges.length} completed
          </Badge>
        </div>

        {/* Category Progress */}
        <div className="grid gap-3 sm:grid-cols-3">
          {challengeSets.map((set) => {
            const done = set.challenges.filter(
              (c) => challengeProgress[c.id]?.completed
            ).length;
            const total = set.challenges.length;
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <button
                key={set.category}
                onClick={() => setCategory(set.category)}
                className={
                  "text-left p-3.5 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all " +
                  (category === set.category
                    ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
                    : "")
                }
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{set.label}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {done}/{total}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2">
                  {set.description}
                </p>
                <Progress value={pct} className="h-1.5" />
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <ChallengeFilters
          category={category}
          difficulty={difficulty}
          dialect={dialect}
          onCategoryChange={setCategory}
          onDifficultyChange={setDifficulty}
          onDialectChange={setDialect}
        />

        {/* Challenge Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              progress={challengeProgress[challenge.id]}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No challenges match your filters. Try changing the category or difficulty.
          </div>
        )}
      </div>
    </div>
  );
}
