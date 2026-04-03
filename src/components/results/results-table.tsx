"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsTableProps {
  columns: string[];
  rows: (string | number | null | Uint8Array)[][];
}

function formatCell(value: string | number | null | Uint8Array): string {
  if (value === null) return "NULL";
  if (value instanceof Uint8Array) return `[BLOB ${value.length} bytes]`;
  return String(value);
}

export function ResultsTable({ columns, rows }: ResultsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 text-center text-xs">#</TableHead>
          {columns.map((col, i) => (
            <TableHead key={i} className="text-xs font-semibold">
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            <TableCell className="text-center text-xs text-muted-foreground">
              {i + 1}
            </TableCell>
            {row.map((cell, j) => (
              <TableCell
                key={j}
                className={`text-xs font-mono ${cell === null ? "text-muted-foreground italic" : ""}`}
              >
                {formatCell(cell)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
