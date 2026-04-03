"use client";

import { QueryResult } from "@/types/sql";
import { Clock, Rows3 } from "lucide-react";

interface ExecutionInfoProps {
  result: QueryResult;
}

export function ExecutionInfo({ result }: ExecutionInfoProps) {
  const rowCount = result.values.length;
  const time = result.executionTimeMs.toFixed(1);

  return (
    <div className="flex items-center gap-4 px-3 py-1.5 border-b text-xs text-muted-foreground bg-muted/20">
      <span className="flex items-center gap-1">
        <Rows3 className="h-3 w-3" />
        {rowCount} row{rowCount !== 1 ? "s" : ""}
        {result.rowsAffected > 0 && ` (${result.rowsAffected} affected)`}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {time}ms
      </span>
    </div>
  );
}
