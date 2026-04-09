"use client";

import Link from "next/link";
import {
  Challenge,
  ChallengeProgress,
  getChallengeDialects,
} from "@/types/challenge";
import { SqlDialect } from "@/lib/sql/dialect";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  intermediate:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  advanced:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  expert: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const DIALECT_META: Record<
  SqlDialect,
  { label: string; short: string; className: string }
> = {
  sqlite: {
    label: "SQLite",
    short: "SQLite",
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  mysql: {
    label: "MySQL",
    short: "MySQL",
    className:
      "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
  },
  postgresql: {
    label: "PostgreSQL",
    short: "PgSQL",
    className:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
};

interface ChallengeCardProps {
  challenge: Challenge;
  progress?: ChallengeProgress;
}

export function ChallengeCard({ challenge, progress }: ChallengeCardProps) {
  const completed = progress?.completed ?? false;
  const dialects = getChallengeDialects(challenge);
  const allThree = dialects.length === 3;

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40 group">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            {completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                {challenge.title}
              </CardTitle>
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {challenge.description.replace(/\*\*/g, "")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pl-7 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] ${DIFFICULTY_COLORS[challenge.difficulty]}`}
            >
              {challenge.difficulty}
            </Badge>
            {allThree ? (
              <Badge
                variant="outline"
                className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                title="Runs on SQLite, MySQL and PostgreSQL"
              >
                Portable
              </Badge>
            ) : (
              dialects.map((d) => {
                const meta = DIALECT_META[d];
                return (
                  <Badge
                    key={d}
                    variant="outline"
                    className={`text-[10px] ${meta.className}`}
                    title={`Works on ${meta.label}`}
                  >
                    {meta.short}
                  </Badge>
                );
              })
            )}
            {progress?.attempts && progress.attempts > 0 && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                {progress.attempts} attempt
                {progress.attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
