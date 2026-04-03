"use client";

import { useDBStore } from "@/stores/db-store";
import { ResultsTable } from "./results-table";
import { ErrorDisplay } from "./error-display";
import { ExecutionInfo } from "./execution-info";
import { TableIcon } from "lucide-react";

export function ResultsPanel() {
  const results = useDBStore((s) => s.lastResults);
  const error = useDBStore((s) => s.lastError);

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground gap-2">
        <TableIcon className="h-10 w-10 opacity-30" />
        <p className="text-sm">Run your query to see results</p>
        <p className="text-xs">Press Ctrl+Enter to execute</p>
      </div>
    );
  }

  const lastResult = results[results.length - 1];

  return (
    <div className="flex flex-col h-full">
      <ExecutionInfo result={lastResult} />
      {lastResult.columns.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <ResultsTable columns={lastResult.columns} rows={lastResult.values} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full min-h-[100px] text-muted-foreground">
          <p className="text-sm">
            Query executed successfully. {lastResult.rowsAffected} row(s) affected.
          </p>
        </div>
      )}
    </div>
  );
}
