"use client";

import type { ColumnDef } from "./column-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileCode } from "lucide-react";
import { useState } from "react";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";

interface SQLPreviewProps {
  tableName: string;
  columns: ColumnDef[];
  createIndexes?: boolean;
  withoutRowid?: boolean;
  dialect?: SqlDialect;
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
  if (val.startsWith("(") && val.endsWith(")")) return val;
  if (!Number.isNaN(Number(val))) return val;
  if (/^'.*'$/.test(val)) return val;
  return `'${val.replace(/'/g, "''")}'`;
}

/** Maps a user-selected "INT / BIGINT" type plus auto-increment to the
 * SERIAL / BIGSERIAL equivalent when generating for Postgres. */
function pgSerialFor(type: string): string {
  const t = type.trim().toUpperCase();
  if (t === "BIGINT") return "BIGSERIAL";
  if (t === "SMALLINT") return "SMALLSERIAL";
  return "SERIAL";
}

export function generateCreateSQL(
  tableName: string,
  columns: ColumnDef[],
  opts: {
    createIndexes?: boolean;
    withoutRowid?: boolean;
    dialect?: SqlDialect;
  } = {},
): string {
  const dialect: SqlDialect = opts.dialect ?? "sqlite";
  const validCols = columns.filter((c) => c.name.trim());
  if (!tableName.trim() || validCols.length === 0) {
    return "-- Define a table name and at least one column to see the SQL preview";
  }

  const qi = (n: string) => quoteIdent(n, dialect);
  const lines: string[] = [];
  const constraintLines: string[] = [];
  const extraStatements: string[] = [];

  for (const col of validCols) {
    let effectiveType = col.type;

    // Postgres: a PK + auto-increment column becomes SERIAL/BIGSERIAL and
    // drops the explicit NOT NULL / PRIMARY KEY keywords handled below.
    const pgAutoSerial =
      dialect === "postgresql" && col.primaryKey && col.autoIncrement;
    if (pgAutoSerial) {
      effectiveType = pgSerialFor(col.type);
    }

    const parts: string[] = [`  ${qi(col.name)} ${effectiveType}`];

    if (col.generatedExpr.trim()) {
      // Postgres only supports STORED. SQLite/MySQL support both.
      const mode =
        dialect === "postgresql"
          ? "STORED"
          : col.generatedStored
            ? "STORED"
            : "VIRTUAL";
      parts.push(
        `GENERATED ALWAYS AS (${col.generatedExpr.trim()}) ${mode}`,
      );
    }

    // MySQL: AUTO_INCREMENT must come before PRIMARY KEY as a column attr.
    if (dialect === "mysql" && col.primaryKey && col.autoIncrement) {
      parts.push("AUTO_INCREMENT");
    }

    if (col.primaryKey) {
      parts.push("PRIMARY KEY");
      if (dialect === "sqlite" && col.autoIncrement) {
        parts.push("AUTOINCREMENT");
      }
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
      if (dialect === "mysql") {
        // MySQL/InnoDB ignores inline REFERENCES. Emit a table-level
        // FOREIGN KEY constraint instead so the FK is actually enforced.
        let fk = `  FOREIGN KEY (${qi(col.name)}) REFERENCES ${qi(col.referencesTable.trim())}(${qi(refCol)})`;
        if (col.onDelete) fk += ` ON DELETE ${col.onDelete}`;
        if (col.onUpdate) fk += ` ON UPDATE ${col.onUpdate}`;
        constraintLines.push(fk);
      } else {
        let ref = `REFERENCES ${qi(col.referencesTable.trim())}(${qi(refCol)})`;
        if (col.onDelete) ref += ` ON DELETE ${col.onDelete}`;
        if (col.onUpdate) ref += ` ON UPDATE ${col.onUpdate}`;
        parts.push(ref);
      }
    }

    lines.push(parts.join(" "));
  }

  const allLines = [...lines, ...constraintLines];
  let sql = `CREATE TABLE ${qi(tableName)} (\n${allLines.join(",\n")}\n)`;
  // WITHOUT ROWID is SQLite-only.
  if (opts.withoutRowid && dialect === "sqlite") sql += " WITHOUT ROWID";
  sql += ";";

  // Emit secondary indexes. Two sources can ask for one:
  //   1. `col.index` - the per-column INDEX toggle in the editor
  //   2. `opts.createIndexes` - the table-level "Extra indexes" switch which
  //      auto-indexes every UNIQUE column (legacy behaviour, kept for
  //      backward compatibility)
  // PRIMARY KEY columns are intentionally skipped because every supported
  // engine already creates an implicit unique index for them.
  const indexed = new Set<string>();
  for (const col of validCols) {
    if (col.primaryKey) continue;
    const wantUnique = col.unique && (opts.createIndexes ?? false);
    const wantPlain = col.index && !col.unique;
    if (!wantUnique && !wantPlain) continue;
    if (indexed.has(col.name)) continue;
    indexed.add(col.name);
    const idxName = `idx_${tableName}_${col.name}`;
    const keyword = wantUnique ? "CREATE UNIQUE INDEX" : "CREATE INDEX";
    extraStatements.push(
      `${keyword} ${qi(idxName)} ON ${qi(tableName)}(${qi(col.name)});`,
    );
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
  dialect = "sqlite",
}: SQLPreviewProps) {
  const [copied, setCopied] = useState(false);
  const sql = generateCreateSQL(tableName, columns, {
    createIndexes,
    withoutRowid,
    dialect,
  });

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
          <span className="text-[10px] uppercase tracking-wide opacity-60">
            {dialect}
          </span>
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
