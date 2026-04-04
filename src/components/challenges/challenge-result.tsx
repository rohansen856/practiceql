"use client";

import { ChallengeRunResult } from "@/lib/challenges/challenge-runner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface ChallengeResultProps {
  result: ChallengeRunResult;
}

export function ChallengeResult({ result }: ChallengeResultProps) {
  const { comparison, actualColumns, actualValues, executionTimeMs, error } = result;

  if (error) {
    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">SQL Error</p>
            <pre className="text-xs font-mono mt-1 text-destructive/80 whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <Card
        className={`p-4 ${
          comparison.correct
            ? "border-green-500/50 bg-green-500/5"
            : "border-orange-500/50 bg-orange-500/5"
        }`}
      >
        <div className="flex items-start gap-2">
          {comparison.correct ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                comparison.correct ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {comparison.message}
            </p>
            {comparison.details && (
              <pre className="text-xs font-mono mt-1 text-muted-foreground whitespace-pre-wrap">
                {comparison.details}
              </pre>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {executionTimeMs.toFixed(1)}ms
          </Badge>
        </div>
      </Card>

      {/* Results table */}
      {actualColumns.length > 0 && (
        <Card className="overflow-auto max-h-64">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-2 py-1 text-left text-muted-foreground w-8">#</th>
                {actualColumns.map((col, i) => (
                  <th key={i} className="px-2 py-1 text-left font-mono font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actualValues.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  <td className="px-2 py-1 text-muted-foreground">{ri + 1}</td>
                  {row.map((val, ci) => (
                    <td key={ci} className="px-2 py-1 font-mono">
                      {val === null ? (
                        <span className="italic text-muted-foreground">NULL</span>
                      ) : val instanceof Uint8Array ? (
                        <span className="text-muted-foreground">[BLOB]</span>
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
  );
}
