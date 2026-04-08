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
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableInfo, ColumnInfo, ForeignKeyInfo } from "@/types/sql";
import { useDBStore } from "@/stores/db-store";
import { Trash2, Download, Table2, KeyRound, Type, Link2 } from "lucide-react";
import { toast } from "sonner";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";

interface TableManagerProps {
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  dialect?: SqlDialect;
  onExecute: (sql: string) => Promise<void>;
  onRefresh: () => void;
}

export function TableManager({
  tables,
  schemas,
  dialect = "sqlite",
  onExecute,
  onRefresh,
}: TableManagerProps) {
  const foreignKeys = useDBStore((s) => s.foreignKeys);
  const rowCounts = useDBStore((s) => s.rowCounts);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

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
            <ScrollArea className="max-h-48">
              <div className="p-2 space-y-0.5">
                {cols.map((col) => {
                  const fk = fkByColumn[col.name];
                  return (
                    <div
                      key={col.name}
                      className="flex items-center gap-2 px-2 py-0.5 text-xs flex-wrap"
                    >
                      {col.primaryKey ? (
                        <KeyRound className="h-3 w-3 text-amber-500 shrink-0" />
                      ) : fk ? (
                        <Link2 className="h-3 w-3 text-primary shrink-0" />
                      ) : (
                        <Type className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-mono">{col.name}</span>
                      <span className="text-muted-foreground">{col.type}</span>
                      {col.notNull && !col.primaryKey && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          NOT NULL
                        </Badge>
                      )}
                      {fk && (
                        <span
                          className="text-[10px] font-mono px-1.5 py-0 rounded border border-primary/30 bg-primary/5 text-primary"
                          title={
                            [
                              `REFERENCES ${fk.refTable}(${fk.refColumn})`,
                              fk.onDelete && fk.onDelete !== "NO ACTION"
                                ? `ON DELETE ${fk.onDelete}`
                                : "",
                              fk.onUpdate && fk.onUpdate !== "NO ACTION"
                                ? `ON UPDATE ${fk.onUpdate}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")
                          }
                        >
                          → {fk.refTable}
                          {fk.refColumn ? `(${fk.refColumn})` : ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
