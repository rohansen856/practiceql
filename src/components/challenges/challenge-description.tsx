"use client";

import { useState } from "react";
import { Challenge, getChallengeDialects } from "@/types/challenge";
import { SqlDialect } from "@/lib/sql/dialect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, ChevronDown, ChevronRight, Eye } from "lucide-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  intermediate: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  advanced: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  expert: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

const DIALECT_META: Record<SqlDialect, { label: string; className: string }> = {
  sqlite: {
    label: "SQLite",
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  mysql: {
    label: "MySQL",
    className:
      "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
  },
  postgresql: {
    label: "PostgreSQL",
    className:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
};

interface ChallengeDescriptionProps {
  challenge: Challenge;
}

export function ChallengeDescription({ challenge }: ChallengeDescriptionProps) {
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showExpected, setShowExpected] = useState(false);

  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            {challenge.category}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] ${DIFFICULTY_COLORS[challenge.difficulty]}`}
          >
            {challenge.difficulty}
          </Badge>
          {(() => {
            const ds = getChallengeDialects(challenge);
            if (ds.length === 3) {
              return (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  title="Portable across SQLite, MySQL and PostgreSQL"
                >
                  Portable
                </Badge>
              );
            }
            return ds.map((d) => (
              <Badge
                key={d}
                variant="outline"
                className={`text-[10px] ${DIALECT_META[d].className}`}
                title={`Works on ${DIALECT_META[d].label}`}
              >
                {DIALECT_META[d].label}
              </Badge>
            ));
          })()}
        </div>
        <h2 className="text-lg font-semibold">{challenge.title}</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {renderDescription(challenge.description)}
        </p>
      </div>

      {/* Expected Output Preview */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs h-7 px-2"
          onClick={() => setShowExpected(!showExpected)}
        >
          <Eye className="h-3 w-3" />
          Expected Output
          {showExpected ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        {showExpected && (
          <Card className="mt-2 overflow-auto max-h-48">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  {challenge.expectedColumns.map((col, i) => (
                    <th key={i} className="px-2 py-1 text-left font-mono font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {challenge.expectedOutput.map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0">
                    {row.map((val, ci) => (
                      <td key={ci} className="px-2 py-1 font-mono">
                        {val === null ? (
                          <span className="italic text-muted-foreground">NULL</span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Hints */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-medium">
            Hints ({hintsRevealed}/{challenge.hints.length})
          </span>
        </div>
        {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
          <Card key={i} className="p-2">
            <p className="text-xs text-muted-foreground font-mono">{hint}</p>
          </Card>
        ))}
        {hintsRevealed < challenge.hints.length && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => setHintsRevealed((h) => h + 1)}
          >
            Reveal Hint {hintsRevealed + 1}
          </Button>
        )}
      </div>
    </div>
  );
}
