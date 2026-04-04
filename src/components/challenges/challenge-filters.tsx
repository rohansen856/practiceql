"use client";

import { Button } from "@/components/ui/button";
import { ChallengeCategory, Difficulty } from "@/types/challenge";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: ChallengeCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "where", label: "WHERE" },
  { value: "joins", label: "JOINs" },
  { value: "aggregation", label: "Aggregation" },
  { value: "having", label: "HAVING" },
  { value: "subqueries", label: "Subqueries" },
  { value: "window-functions", label: "Window Functions" },
  { value: "indexes", label: "Indexes" },
  { value: "constraints", label: "Constraints" },
  { value: "complex-queries", label: "Complex Queries" },
  { value: "advanced", label: "Advanced" },
];

const DIFFICULTIES: { value: Difficulty | "all"; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

interface ChallengeFiltersProps {
  category: ChallengeCategory | "all";
  difficulty: Difficulty | "all";
  onCategoryChange: (c: ChallengeCategory | "all") => void;
  onDifficultyChange: (d: Difficulty | "all") => void;
}

export function ChallengeFilters({
  category,
  difficulty,
  onCategoryChange,
  onDifficultyChange,
}: ChallengeFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <Button
            key={c.value}
            variant={category === c.value ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-xs", category !== c.value && "text-muted-foreground")}
            onClick={() => onCategoryChange(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DIFFICULTIES.map((d) => (
          <Button
            key={d.value}
            variant={difficulty === d.value ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-xs", difficulty !== d.value && "text-muted-foreground")}
            onClick={() => onDifficultyChange(d.value)}
          >
            {d.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
