"use client";

import { QueryResult } from "@/types/sql";
import { Clock, Rows3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadCsv, toCsv, type CsvCell } from "@/lib/export/csv";

interface ExecutionInfoProps {
  result: QueryResult;
}

export function ExecutionInfo({ result }: ExecutionInfoProps) {
  const rowCount = result.values.length;
  const time = result.executionTimeMs.toFixed(1);
  const canExport = result.columns.length > 0 && rowCount > 0;

  const handleDownload = () => {
    if (!canExport) return;
    try {
      const csv = toCsv(result.columns, result.values as CsvCell[][]);
      const stamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      downloadCsv(`practiceql-results-${stamp}.csv`, csv);
      toast.success(`Exported ${rowCount} row${rowCount === 1 ? "" : "s"}`);
    } catch {
      toast.error("Failed to export CSV");
    }
  };

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
      <div className="flex-1" />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDownload}
        disabled={!canExport}
        title="Download as CSV"
        aria-label="Download as CSV"
        className="h-6 px-2 gap-1 text-xs"
      >
        <Download className="h-3 w-3" />
        CSV
      </Button>
    </div>
  );
}
