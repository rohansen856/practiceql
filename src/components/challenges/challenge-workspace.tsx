"use client";

import { useState, useCallback } from "react";
import { Challenge } from "@/types/challenge";
import { ChallengeDescription } from "./challenge-description";
import { ChallengeResult } from "./challenge-result";
import { SQLEditor } from "@/components/sql-editor/sql-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { runChallenge, ChallengeRunResult } from "@/lib/challenges/challenge-runner";
import { useProgressStore } from "@/stores/progress-store";
import { Play, Loader2, RotateCcw } from "lucide-react";

interface ChallengeWorkspaceProps {
  challenge: Challenge;
}

export function ChallengeWorkspace({ challenge }: ChallengeWorkspaceProps) {
  const [sql, setSQL] = useState(challenge.starterCode ?? "");
  const [result, setResult] = useState<ChallengeRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const markComplete = useProgressStore((s) => s.markChallengeComplete);
  const recordAttempt = useProgressStore((s) => s.recordAttempt);

  const handleRun = useCallback(async () => {
    if (!sql.trim() || running) return;
    setRunning(true);
    try {
      const res = await runChallenge(challenge, sql);
      setResult(res);
      if (res.comparison.correct) {
        await markComplete(challenge.id, sql);
      } else {
        await recordAttempt(challenge.id, sql);
      }
    } catch (e: unknown) {
      setResult({
        comparison: { correct: false, message: "Unexpected error" },
        actualColumns: [],
        actualValues: [],
        executionTimeMs: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setRunning(false);
    }
  }, [sql, running, challenge, markComplete, recordAttempt]);

  const handleReset = () => {
    setSQL(challenge.starterCode ?? "");
    setResult(null);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left: Description */}
      <ResizablePanel defaultSize={35} minSize={25}>
        <ScrollArea className="h-full">
          <div className="p-4">
            <ChallengeDescription challenge={challenge} />
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: Editor + Results */}
      <ResizablePanel defaultSize={65}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground flex-1">
                  Your Solution
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleRun}
                  disabled={running || !sql.trim()}
                >
                  {running ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Run
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <SQLEditor
                  value={sql}
                  onChange={setSQL}
                  onExecute={handleRun}
                  height="100%"
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={20}>
            <ScrollArea className="h-full">
              <div className="p-4">
                {result ? (
                  <ChallengeResult result={result} />
                ) : (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Run your query to see results
                  </div>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
