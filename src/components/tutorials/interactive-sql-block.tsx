"use client";

import { useState, useCallback } from "react";
import { SQLEditor } from "@/components/sql-editor/sql-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SqliteEngine } from "@/lib/db/sql-engine";
import { Play, Loader2, RotateCcw } from "lucide-react";
import { QueryResult } from "@/types/sql";

interface InteractiveSQLBlockProps {
  defaultSQL: string;
  seedSQL?: string;
  title?: string;
  description?: string;
}

export function InteractiveSQLBlock({
  defaultSQL,
  seedSQL,
  title,
  description,
}: InteractiveSQLBlockProps) {
  const [sql, setSQL] = useState(defaultSQL);
  const [results, setResults] = useState<QueryResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = useCallback(async () => {
    if (!sql.trim() || running) return;
    setRunning(true);
    setError(null);
    setResults(null);

    try {
      const engine = await SqliteEngine.create();
      try {
        if (seedSQL) engine.exec(seedSQL);
        const res = engine.exec(sql);
        setResults(res);
      } finally {
        engine.close();
      }
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? (e as { message: string }).message : String(e);
      setError(msg);
    } finally {
      setRunning(false);
    }
  }, [sql, seedSQL, running]);

  return (
    <Card className="my-4 overflow-hidden">
      {(title || description) && (
        <div className="px-4 py-2 border-b bg-muted/30">
          {title && <p className="text-sm font-medium">{title}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="border-b" style={{ height: "120px" }}>
        <SQLEditor value={sql} onChange={setSQL} onExecute={handleRun} height="100%" />
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20">
        <Button
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleRun}
          disabled={running || !sql.trim()}
        >
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Run
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => { setSQL(defaultSQL); setResults(null); setError(null); }}
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>
      {error && (
        <div className="px-4 py-2 bg-destructive/5 border-b">
          <pre className="text-xs font-mono text-destructive whitespace-pre-wrap">{error}</pre>
        </div>
      )}
      {results && results.length > 0 && results[0].columns.length > 0 && (
        <ScrollArea className="max-h-48">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {results[results.length - 1].columns.map((col, i) => (
                  <th key={i} className="px-2 py-1 text-left font-mono font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results[results.length - 1].values.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {row.map((val, ci) => (
                    <td key={ci} className="px-2 py-1 font-mono">
                      {val === null ? <span className="italic text-muted-foreground">NULL</span> : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      )}
      {results && results.length > 0 && results[0].columns.length === 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground">
          Query executed. {results[0].rowsAffected > 0 ? `${results[0].rowsAffected} rows affected.` : "No rows returned."}
        </div>
      )}
    </Card>
  );
}
