"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableInfo, ColumnInfo, ForeignKeyInfo, QueryResult } from "@/types/sql";
import { useDBStore } from "@/stores/db-store";
import {
  Trash2,
  Download,
  Table2,
  KeyRound,
  Type,
  Link2,
  ArrowRight,
  Ban,
  Hash,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";
import { EditTableDialog } from "./edit-table-dialog";

interface TableManagerProps {
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  dialect?: SqlDialect;
  onExecute: (sql: string) => Promise<void>;
  /**
   * Raw engine `executeSQL` used by the Edit dialog when it needs to read
   * results back (e.g. listing indexes). Mutations from inside the dialog
   * also go through this and are followed by `onRefresh`.
   */
  executeSQL: (sql: string) => Promise<QueryResult[] | null | undefined>;
  onRefresh: () => Promise<void> | void;
}

export function TableManager({
  tables,
  schemas,
  dialect = "sqlite",
  onExecute,
  executeSQL,
  onRefresh,
}: TableManagerProps) {
  const foreignKeys = useDBStore((s) => s.foreignKeys);
  const rowCounts = useDBStore((s) => s.rowCounts);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);

  const handleDrop = async (tableName: string) => {
    try {
      await onExecute(`DROP TABLE ${quoteIdent(tableName, dialect)};`);
      toast.success(`Table "${tableName}" dropped`);
      setDropTarget(null);
      onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const handleExport = async (tableName: string) => {
    try {
      const cols = schemas[tableName] ?? [];
      const fks = foreignKeys[tableName] ?? [];
      const fkByColumn: Record<string, ForeignKeyInfo> = {};
      for (const fk of fks) fkByColumn[fk.column] = fk;
      const qi = (n: string) => quoteIdent(n, dialect);

      const colDefs = cols.map((c) => {
        const parts = [`${qi(c.name)} ${c.type}`];
        if (c.primaryKey) parts.push("PRIMARY KEY");
        if (c.notNull && !c.primaryKey) parts.push("NOT NULL");
        const fk = fkByColumn[c.name];
        if (fk) {
          parts.push(
            `REFERENCES ${qi(fk.refTable)}(${qi(fk.refColumn || "id")})`,
          );
          if (fk.onDelete && fk.onDelete !== "NO ACTION")
            parts.push(`ON DELETE ${fk.onDelete}`);
          if (fk.onUpdate && fk.onUpdate !== "NO ACTION")
            parts.push(`ON UPDATE ${fk.onUpdate}`);
        }
        return parts.join(" ");
      });
      const sql = `CREATE TABLE ${qi(tableName)} (\n  ${colDefs.join(",\n  ")}\n);\n\n`;

      await navigator.clipboard.writeText(sql);
      toast.success("CREATE TABLE SQL copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No tables yet. Create one above!
      </div>
    );
  }

  const editTable = editTarget
    ? tables.find((t) => t.name === editTarget) ?? null
    : null;
  const editColumns = editTable ? schemas[editTable.name] ?? [] : [];
  const editForeignKeys = editTable ? foreignKeys[editTable.name] ?? [] : [];

  return (
    <div className="space-y-2">
      {tables.map((table) => {
        const cols = schemas[table.name] ?? [];
        const fks = foreignKeys[table.name] ?? [];
        const fkByColumn: Record<string, ForeignKeyInfo> = {};
        for (const fk of fks) fkByColumn[fk.column] = fk;
        const rowCount = rowCounts[table.name];
        return (
          <div key={table.name} className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <Table2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium flex-1 flex items-baseline gap-1.5">
                {table.name}
                {typeof rowCount === "number" && (
                  <span
                    className="text-[11px] font-normal text-muted-foreground"
                    title={`${rowCount} row${rowCount === 1 ? "" : "s"}`}
                  >
                    ({rowCount})
                  </span>
                )}
              </span>
              {table.type === "view" && (
                <Badge variant="secondary" className="text-[10px]">
                  view
                </Badge>
              )}
              {fks.length > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 border-primary/30 bg-primary/5 text-primary"
                >
                  <Link2 className="h-2.5 w-2.5" />
                  {fks.length} fk
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {cols.length} cols
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditTarget(table.name)}
                title="Edit table"
                disabled={table.type === "view"}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleExport(table.name)}
                title="Copy CREATE SQL"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Dialog
                open={dropTarget === table.name}
                onOpenChange={(open) => setDropTarget(open ? table.name : null)}
              >
                <DialogTrigger
                  title="Drop table"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Drop table &quot;{table.name}&quot;?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete the table and all its data. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDropTarget(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleDrop(table.name)}>
                      Drop Table
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-2 space-y-1">
              {cols.map((col, idx) => {
                  const fk = fkByColumn[col.name];
                  const hasDefault =
                    col.defaultValue !== null &&
                    col.defaultValue !== undefined &&
                    col.defaultValue !== "";
                  return (
                    <div
                      key={col.name}
                      className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-mono text-[10px] text-muted-foreground/80 w-5 text-right tabular-nums"
                          title={`Column #${idx + 1}`}
                        >
                          {idx + 1}
                        </span>
                        {col.primaryKey ? (
                          <KeyRound className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        ) : fk ? (
                          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <Type className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-mono font-medium">
                          {col.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 font-mono uppercase"
                        >
                          {col.type || "ANY"}
                        </Badge>
                        {col.primaryKey && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 gap-0.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          >
                            <KeyRound className="h-2.5 w-2.5" />
                            PK
                          </Badge>
                        )}
                        {col.notNull ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 gap-0.5 border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            NOT NULL
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 text-muted-foreground"
                          >
                            NULLABLE
                          </Badge>
                        )}
                        {fk && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 gap-0.5 border-primary/30 bg-primary/5 text-primary"
                          >
                            <Link2 className="h-2.5 w-2.5" />
                            FK
                          </Badge>
                        )}
                      </div>

                      {(hasDefault || fk) && (
                        <div className="mt-1 pl-7 flex items-center gap-2 flex-wrap text-[10px]">
                          {hasDefault && (
                            <span
                              className="inline-flex items-center gap-1 font-mono px-1.5 py-0 rounded border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                              title={`DEFAULT ${col.defaultValue}`}
                            >
                              <Hash className="h-2.5 w-2.5" />
                              DEFAULT
                              <span className="font-normal">
                                {String(col.defaultValue)}
                              </span>
                            </span>
                          )}
                          {fk && (
                            <span className="inline-flex items-center gap-1 font-mono px-1.5 py-0 rounded border border-primary/30 bg-primary/5 text-primary">
                              <ArrowRight className="h-2.5 w-2.5" />
                              {fk.refTable}
                              {fk.refColumn ? `(${fk.refColumn})` : ""}
                            </span>
                          )}
                          {fk?.onDelete && fk.onDelete !== "NO ACTION" && (
                            <span className="inline-flex items-center font-mono px-1.5 py-0 rounded border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                              ON DELETE {fk.onDelete}
                            </span>
                          )}
                          {fk?.onUpdate && fk.onUpdate !== "NO ACTION" && (
                            <span className="inline-flex items-center font-mono px-1.5 py-0 rounded border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300">
                              ON UPDATE {fk.onUpdate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        );
      })}

      <EditTableDialog
        tableName={editTable?.name ?? null}
        columns={editColumns}
        foreignKeys={editForeignKeys}
        dialect={dialect}
        executeSQL={executeSQL}
        onRefresh={onRefresh}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
