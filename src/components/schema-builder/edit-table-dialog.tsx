"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  KeyRound,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  defaultColumnTypes,
  quoteIdent,
  type SqlDialect,
} from "@/lib/sql/dialect";
import {
  createIndexSQL,
  dropIndexSQL,
  listIndexesQuery,
  parseIndexesResult,
  type IndexInfo,
} from "@/lib/sql/indexes";
import type { ColumnInfo, ForeignKeyInfo, QueryResult } from "@/types/sql";

interface EditTableDialogProps {
  /** When non-null, dialog is open and editing this table. */
  tableName: string | null;
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  dialect: SqlDialect;
  onClose: () => void;
  /**
   * Used for everything: DDL (ALTER/DROP/CREATE) and SELECTs (index listing).
   * Returns null when the engine errored.
   */
  executeSQL: (sql: string) => Promise<QueryResult[] | null | undefined>;
  /** Called after mutations so the parent can re-fetch the catalog. */
  onRefresh: () => Promise<void> | void;
}

interface AddColumnDraft {
  name: string;
  type: string;
  notNull: boolean;
  unique: boolean;
  index: boolean;
  defaultValue: string;
}

interface AddIndexDraft {
  column: string;
  unique: boolean;
}

const emptyAddColumn = (dialect: SqlDialect): AddColumnDraft => ({
  name: "",
  type: defaultColumnTypes(dialect)[1]?.types[0] ?? "TEXT",
  notNull: false,
  unique: false,
  index: false,
  defaultValue: "",
});

export function EditTableDialog({
  tableName,
  columns,
  foreignKeys,
  dialect,
  onClose,
  executeSQL,
  onRefresh,
}: EditTableDialogProps) {
  const open = tableName !== null;

  // Form state. All state is reset whenever the dialog opens for a fresh
  // table, so users never see stale drafts from a previous edit session.
  const [renameTo, setRenameTo] = useState("");
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null);
  const [renameColumnTo, setRenameColumnTo] = useState("");
  const [addCol, setAddCol] = useState<AddColumnDraft>(() =>
    emptyAddColumn(dialect),
  );
  const [addIndex, setAddIndex] = useState<AddIndexDraft>({
    column: "",
    unique: false,
  });
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [indexesLoading, setIndexesLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fkByColumn = useMemo(() => {
    const map: Record<string, ForeignKeyInfo> = {};
    for (const fk of foreignKeys) map[fk.column] = fk;
    return map;
  }, [foreignKeys]);

  const typeGroups = useMemo(() => defaultColumnTypes(dialect), [dialect]);

  const refreshIndexes = useCallback(async () => {
    if (!tableName) return;
    setIndexesLoading(true);
    try {
      const sql = listIndexesQuery(tableName, dialect);
      const results = await executeSQL(sql);
      const last = Array.isArray(results) ? results.at(-1) : undefined;
      setIndexes(parseIndexesResult(last ?? null, dialect));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load indexes");
      setIndexes([]);
    } finally {
      setIndexesLoading(false);
    }
  }, [tableName, dialect, executeSQL]);

  // (Re)initialise state when the dialog opens for a different table.
  const lastTableRef = useRef<string | null>(null);
  useEffect(() => {
    if (!tableName) {
      lastTableRef.current = null;
      return;
    }
    if (lastTableRef.current === tableName) return;
    lastTableRef.current = tableName;
    setRenameTo(tableName);
    setRenamingColumn(null);
    setRenameColumnTo("");
    setAddCol(emptyAddColumn(dialect));
    setAddIndex({
      column: columns[0]?.name ?? "",
      unique: false,
    });
    setIndexes([]);
    void refreshIndexes();
  }, [tableName, dialect, columns, refreshIndexes]);

  if (!tableName) return null;

  const qi = (n: string) => quoteIdent(n, dialect);

  const runMutation = async (label: string, sql: string): Promise<boolean> => {
    setBusy(label);
    try {
      const result = await executeSQL(sql);
      if (result === null) {
        // executeSQL surfaces the error via setError + toast already.
        return false;
      }
      toast.success(`${label} applied`);
      await onRefresh();
      await refreshIndexes();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleRenameTable = async () => {
    const target = renameTo.trim();
    if (!target) {
      toast.error("Table name is required");
      return;
    }
    if (target === tableName) return;
    const sql = `ALTER TABLE ${qi(tableName)} RENAME TO ${qi(target)};`;
    const ok = await runMutation("Rename table", sql);
    if (ok) onClose();
  };

  const startRenameColumn = (name: string) => {
    setRenamingColumn(name);
    setRenameColumnTo(name);
  };

  const cancelRenameColumn = () => {
    setRenamingColumn(null);
    setRenameColumnTo("");
  };

  const handleRenameColumn = async () => {
    if (!renamingColumn) return;
    const target = renameColumnTo.trim();
    if (!target) {
      toast.error("Column name is required");
      return;
    }
    if (target === renamingColumn) {
      cancelRenameColumn();
      return;
    }
    const sql = `ALTER TABLE ${qi(tableName)} RENAME COLUMN ${qi(renamingColumn)} TO ${qi(target)};`;
    const ok = await runMutation(`Rename ${renamingColumn}`, sql);
    if (ok) cancelRenameColumn();
  };

  const handleDropColumn = async (name: string) => {
    if (!confirm(`Drop column "${name}"? This cannot be undone.`)) return;
    const sql = `ALTER TABLE ${qi(tableName)} DROP COLUMN ${qi(name)};`;
    await runMutation(`Drop ${name}`, sql);
  };

  const handleAddColumn = async () => {
    const name = addCol.name.trim();
    if (!name) {
      toast.error("Column name is required");
      return;
    }
    if (columns.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Column "${name}" already exists`);
      return;
    }

    const parts = [`${qi(name)} ${addCol.type}`];
    if (addCol.notNull) parts.push("NOT NULL");
    if (addCol.unique) parts.push("UNIQUE");
    if (addCol.defaultValue.trim()) {
      parts.push(`DEFAULT ${formatDefaultLiteral(addCol.defaultValue.trim())}`);
    }
    const stmts: string[] = [
      `ALTER TABLE ${qi(tableName)} ADD COLUMN ${parts.join(" ")};`,
    ];
    if (addCol.index && !addCol.unique) {
      stmts.push(createIndexSQL(tableName, name, { dialect }));
    }
    const ok = await runMutation(`Add ${name}`, stmts.join("\n"));
    if (ok) setAddCol(emptyAddColumn(dialect));
  };

  const handleCreateIndex = async () => {
    const col = addIndex.column.trim();
    if (!col) {
      toast.error("Pick a column to index");
      return;
    }
    const sql = createIndexSQL(tableName, col, {
      unique: addIndex.unique,
      dialect,
    });
    const ok = await runMutation(`Index on ${col}`, sql);
    if (ok) setAddIndex({ column: addIndex.column, unique: false });
  };

  const handleDropIndex = async (info: IndexInfo) => {
    if (info.isPrimary || info.isAuto) return;
    if (!confirm(`Drop index "${info.name}"?`)) return;
    const sql = dropIndexSQL(info, tableName, dialect);
    await runMutation(`Drop ${info.name}`, sql);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="!max-w-2xl gap-3 p-0 sm:!max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Edit table
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                {tableName}
              </code>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-[11px]">
            Rename, drop, or add columns and indexes. Each change runs a
            single ALTER/CREATE/DROP and refreshes the catalog.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="columns" className="px-4 pb-3">
          <TabsList className="w-full">
            <TabsTrigger value="columns" className="flex-1 text-xs">
              Columns
            </TabsTrigger>
            <TabsTrigger value="indexes" className="flex-1 text-xs">
              Indexes
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 text-xs">
              Table
            </TabsTrigger>
          </TabsList>

          {/* COLUMNS TAB */}
          <TabsContent value="columns" className="mt-3">
            <ScrollArea className="h-[420px] pr-2">
              <div className="space-y-3">
                <section className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Existing columns ({columns.length})
                  </p>
                  <div className="space-y-1.5">
                    {columns.map((col) => {
                      const fk = fkByColumn[col.name];
                      const isRenaming = renamingColumn === col.name;
                      return (
                        <div
                          key={col.name}
                          className="rounded-md border bg-muted/20 px-2 py-1.5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {col.primaryKey ? (
                              <KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            ) : fk ? (
                              <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                            ) : (
                              <span className="h-3.5 w-3.5 shrink-0" />
                            )}

                            {isRenaming ? (
                              <Input
                                value={renameColumnTo}
                                onChange={(e) =>
                                  setRenameColumnTo(
                                    e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                                  )
                                }
                                className="h-7 w-44 font-mono text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") void handleRenameColumn();
                                  if (e.key === "Escape") cancelRenameColumn();
                                }}
                              />
                            ) : (
                              <span className="font-mono text-xs font-medium">
                                {col.name}
                              </span>
                            )}

                            <Badge
                              variant="secondary"
                              className="px-1 py-0 font-mono text-[9px] uppercase"
                            >
                              {col.type || "ANY"}
                            </Badge>
                            {col.primaryKey && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[9px] text-amber-700 dark:text-amber-300"
                              >
                                PK
                              </Badge>
                            )}
                            {col.notNull && !col.primaryKey && (
                              <Badge
                                variant="outline"
                                className="border-rose-500/30 bg-rose-500/10 px-1 py-0 text-[9px] text-rose-700 dark:text-rose-300"
                              >
                                NOT NULL
                              </Badge>
                            )}
                            {fk && (
                              <Badge
                                variant="outline"
                                className="border-primary/30 bg-primary/5 px-1 py-0 text-[9px] text-primary"
                              >
                                → {fk.refTable}
                              </Badge>
                            )}

                            <div className="ml-auto flex items-center gap-1">
                              {isRenaming ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 text-[11px]"
                                    onClick={handleRenameColumn}
                                    disabled={busy !== null}
                                  >
                                    {busy === `Rename ${col.name}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Save"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[11px]"
                                    onClick={cancelRenameColumn}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    title="Rename column"
                                    onClick={() => startRenameColumn(col.name)}
                                    disabled={busy !== null}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    title="Drop column"
                                    onClick={() => handleDropColumn(col.name)}
                                    disabled={
                                      busy !== null || col.primaryKey
                                    }
                                  >
                                    {busy === `Drop ${col.name}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-md border border-dashed bg-card p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Plus className="h-3 w-3" />
                    Add column
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-[11px]">Name</Label>
                      <Input
                        value={addCol.name}
                        onChange={(e) =>
                          setAddCol((s) => ({
                            ...s,
                            name: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                          }))
                        }
                        placeholder="column_name"
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-[11px]">Type</Label>
                      <Select
                        value={addCol.type}
                        onValueChange={(v) =>
                          setAddCol((s) => ({ ...s, type: v ?? "" }))
                        }
                      >
                        <SelectTrigger className="h-8 font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {typeGroups.map((g) => (
                            <SelectGroup key={g.label}>
                              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {g.label}
                              </SelectLabel>
                              {g.types.map((t) => (
                                <SelectItem
                                  key={t}
                                  value={t}
                                  className="font-mono text-xs"
                                >
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[11px]">DEFAULT</Label>
                      <Input
                        value={addCol.defaultValue}
                        onChange={(e) =>
                          setAddCol((s) => ({
                            ...s,
                            defaultValue: e.target.value,
                          }))
                        }
                        placeholder="(optional)"
                        className="h-8 font-mono text-xs"
                      />
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <Switch
                          checked={addCol.notNull}
                          onCheckedChange={(v) =>
                            setAddCol((s) => ({ ...s, notNull: v }))
                          }
                          className="scale-75"
                        />
                        NOT NULL
                      </label>
                      <label className="flex cursor-pointer items-center gap-1.5">
                        <Switch
                          checked={addCol.unique}
                          onCheckedChange={(v) =>
                            setAddCol((s) => ({
                              ...s,
                              unique: v,
                              index: v ? false : s.index,
                            }))
                          }
                          className="scale-75"
                        />
                        UNIQUE
                      </label>
                      <label
                        className={cn(
                          "flex items-center gap-1.5",
                          addCol.unique
                            ? "opacity-50"
                            : "cursor-pointer",
                        )}
                      >
                        <Switch
                          checked={addCol.index && !addCol.unique}
                          onCheckedChange={(v) =>
                            setAddCol((s) => ({ ...s, index: v }))
                          }
                          disabled={addCol.unique}
                          className="scale-75"
                        />
                        INDEX
                      </label>
                      <Button
                        size="sm"
                        className="ml-auto h-7 gap-1 text-xs"
                        onClick={handleAddColumn}
                        disabled={busy !== null || !addCol.name.trim()}
                      >
                        {busy?.startsWith("Add ") ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Add
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* INDEXES TAB */}
          <TabsContent value="indexes" className="mt-3">
            <ScrollArea className="h-[420px] pr-2">
              <div className="space-y-3">
                <section className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Existing indexes ({indexes.length})
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={refreshIndexes}
                      disabled={indexesLoading}
                    >
                      <RefreshCw
                        className={cn(
                          "h-3 w-3",
                          indexesLoading && "animate-spin",
                        )}
                      />
                      Refresh
                    </Button>
                  </div>

                  {indexesLoading && indexes.length === 0 ? (
                    <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                      Loading indexes...
                    </p>
                  ) : indexes.length === 0 ? (
                    <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                      No indexes on this table yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {indexes.map((info) => {
                        const locked = info.isPrimary || info.isAuto;
                        return (
                          <div
                            key={info.name}
                            className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5"
                          >
                            <Zap
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                info.unique
                                  ? "text-emerald-500"
                                  : "text-violet-500",
                              )}
                            />
                            <span className="font-mono text-xs font-medium">
                              {info.name}
                            </span>
                            {info.columns && (
                              <code className="truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                ({info.columns})
                              </code>
                            )}
                            {info.unique && (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 px-1 py-0 text-[9px] text-emerald-700 dark:text-emerald-300"
                              >
                                UNIQUE
                              </Badge>
                            )}
                            {info.isPrimary && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[9px] text-amber-700 dark:text-amber-300"
                              >
                                PK
                              </Badge>
                            )}
                            {info.isAuto && !info.isPrimary && (
                              <Badge
                                variant="outline"
                                className="px-1 py-0 text-[9px] text-muted-foreground"
                              >
                                AUTO
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                              title={
                                locked
                                  ? "Engine-managed index"
                                  : "Drop index"
                              }
                              onClick={() => handleDropIndex(info)}
                              disabled={locked || busy !== null}
                            >
                              {busy === `Drop ${info.name}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-md border border-dashed bg-card p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Plus className="h-3 w-3" />
                    Create index
                  </p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <Label className="text-[11px]">Column</Label>
                      <Select
                        value={addIndex.column || (columns[0]?.name ?? "")}
                        onValueChange={(v) =>
                          setAddIndex((s) => ({ ...s, column: v ?? "" }))
                        }
                      >
                        <SelectTrigger className="h-8 font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((c) => (
                            <SelectItem
                              key={c.name}
                              value={c.name}
                              className="font-mono text-xs"
                            >
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-[11px]">
                      <Switch
                        checked={addIndex.unique}
                        onCheckedChange={(v) =>
                          setAddIndex((s) => ({ ...s, unique: v }))
                        }
                        className="scale-75"
                      />
                      UNIQUE
                    </label>
                    <Button
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={handleCreateIndex}
                      disabled={busy !== null || !addIndex.column}
                    >
                      {busy?.startsWith("Index on") ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Create
                    </Button>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TABLE TAB */}
          <TabsContent value="settings" className="mt-3">
            <div className="space-y-3 rounded-md border border-dashed bg-card p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Rename table
              </p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-[11px]">New name</Label>
                  <Input
                    value={renameTo}
                    onChange={(e) =>
                      setRenameTo(
                        e.target.value
                          .replace(/[^a-zA-Z0-9_]/g, "")
                          .toLowerCase(),
                      )
                    }
                    className="h-8 font-mono text-xs"
                    placeholder={tableName}
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={handleRenameTable}
                  disabled={
                    busy !== null ||
                    !renameTo.trim() ||
                    renameTo === tableName
                  }
                >
                  {busy === "Rename table" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Rename
                </Button>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Renaming runs <code className="rounded bg-muted px-1 font-mono">ALTER TABLE … RENAME TO …</code>. Existing
                indexes and foreign keys are preserved by every supported
                engine.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-2 rounded-b-xl border-t bg-muted/50 px-4 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Convert a user-typed default value into a SQL literal. Mirrors the
 * heuristics used in `sql-preview.tsx` so behaviour is consistent between
 * Create and Edit flows.
 */
function formatDefaultLiteral(raw: string): string {
  const KEYWORD_LITERALS = new Set([
    "NULL",
    "CURRENT_TIMESTAMP",
    "CURRENT_DATE",
    "CURRENT_TIME",
    "TRUE",
    "FALSE",
  ]);
  const upper = raw.toUpperCase();
  if (KEYWORD_LITERALS.has(upper)) return upper;
  if (raw.startsWith("(") && raw.endsWith(")")) return raw;
  if (!Number.isNaN(Number(raw))) return raw;
  if (/^'.*'$/.test(raw)) return raw;
  return `'${raw.replace(/'/g, "''")}'`;
}
