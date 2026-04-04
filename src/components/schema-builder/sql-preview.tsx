"use client";

import type { ColumnDef } from "./column-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileCode } from "lucide-react";
import { useState } from "react";

interface SQLPreviewProps {
  tableName: string;
  columns: ColumnDef[];
  createIndexes?: boolean;
  withoutRowid?: boolean;
}

const KEYWORD_LITERALS = new Set([
  "NULL",
  "CURRENT_TIMESTAMP",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "TRUE",
  "FALSE",
]);

function quoteDefault(raw: string): string {
  const val = raw.trim();
  if (!val) return "";
  const upper = val.toUpperCase();
  if (KEYWORD_LITERALS.has(upper)) return upper;
  // Parenthesised expression passthrough
  if (val.startsWith("(") && val.endsWith(")")) return val;
  if (!Number.isNaN(Number(val))) return val;
  // Already quoted
  if (/^'.*'$/.test(val)) return val;
  return `'${val.replace(/'/g, "''")}'`;
}

export function generateCreateSQL(
  tableName: string,
  columns: ColumnDef[],
  opts: { createIndexes?: boolean; withoutRowid?: boolean } = {},
): string {
  const validCols = columns.filter((c) => c.name.trim());
  if (!tableName.trim() || validCols.length === 0) {
    return "-- Define a table name and at least one column to see the SQL preview";
  }

  const lines: string[] = [];
  const constraintLines: string[] = [];
  const extraStatements: string[] = [];

  for (const col of validCols) {
    const parts: string[] = [`  ${col.name} ${col.type}`];

    if (col.generatedExpr.trim()) {
      parts.push(
        `GENERATED ALWAYS AS (${col.generatedExpr.trim()}) ${col.generatedStored ? "STORED" : "VIRTUAL"}`,
      );
    }

    if (col.primaryKey) {
      parts.push("PRIMARY KEY");
      if (col.autoIncrement) parts.push("AUTOINCREMENT");
    }
    if (col.notNull && !col.primaryKey) parts.push("NOT NULL");
    if (col.unique && !col.primaryKey) parts.push("UNIQUE");

    if (col.defaultValue.trim()) {
      parts.push(`DEFAULT ${quoteDefault(col.defaultValue)}`);
    }

    if (col.collate) parts.push(`COLLATE ${col.collate}`);

    if (col.check.trim()) {
      parts.push(`CHECK (${col.check.trim()})`);
    }

    if (col.referencesTable.trim()) {
      const refCol = col.referencesColumn.trim() || "id";
      let ref = `REFERENCES ${col.referencesTable.trim()}(${refCol})`;
      if (col.onDelete) ref += ` ON DELETE ${col.onDelete}`;
      if (col.onUpdate) ref += ` ON UPDATE ${col.onUpdate}`;
      parts.push(ref);
    }

    lines.push(parts.join(" "));
  }

  const allLines = [...lines, ...constraintLines];
  let sql = `CREATE TABLE ${tableName} (\n${allLines.join(",\n")}\n)`;
  if (opts.withoutRowid) sql += " WITHOUT ROWID";
  sql += ";";

  if (opts.createIndexes) {
    for (const col of validCols) {
      if (col.unique && !col.primaryKey) {
        extraStatements.push(
          `CREATE UNIQUE INDEX idx_${tableName}_${col.name} ON ${tableName}(${col.name});`,
        );
      }
    }
  }

  return extraStatements.length > 0
    ? `${sql}\n\n${extraStatements.join("\n")}`
    : sql;
}

export function SQLPreview({
  tableName,
  columns,
  createIndexes,
  withoutRowid,
}: SQLPreviewProps) {
  const [copied, setCopied] = useState(false);
  const sql = generateCreateSQL(tableName, columns, { createIndexes, withoutRowid });

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <FileCode className="h-3.5 w-3.5 text-primary" />
          SQL preview
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          title="Copy"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <ScrollArea className="max-h-60">
        <pre className="p-3 text-sm font-mono whitespace-pre-wrap text-foreground">
          {sql}
        </pre>
      </ScrollArea>
    </div>
  );
}
