"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColumnEditor, ColumnDef, createEmptyColumn } from "./column-editor";
import { SQLPreview, generateCreateSQL } from "./sql-preview";
import { Plus, Sparkles, TableProperties } from "lucide-react";
import { toast } from "sonner";
import { SQL_KEYWORDS } from "@/content/sql-keywords";
import { defaultPkColumn, type SqlDialect } from "@/lib/sql/dialect";

const RESERVED_NAMES = new Set<string>(
  SQL_KEYWORDS.filter((k) => k.reserved === "reserved").map((k) =>
    k.keyword.toUpperCase(),
  ),
);

interface CreateTableFormProps {
  tableNames?: string[];
  dialect?: SqlDialect;
  onExecute: (sql: string) => Promise<void>;
}

const firstColumn = (dialect: SqlDialect): ColumnDef => {
  const pk = defaultPkColumn(dialect);
  return {
    ...createEmptyColumn(),
    name: pk.name,
    type: pk.type,
    primaryKey: pk.primaryKey,
    notNull: pk.notNull,
    autoIncrement: pk.autoIncrement,
  };
};

export function CreateTableForm({
  tableNames = [],
  dialect = "sqlite",
  onExecute,
}: CreateTableFormProps) {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>([
    firstColumn(dialect),
    createEmptyColumn(),
  ]);
  const [creating, setCreating] = useState(false);
  const [createIndexes, setCreateIndexes] = useState(false);
  const [withoutRowid, setWithoutRowid] = useState(false);
  const [ifNotExists, setIfNotExists] = useState(false);
  const prevDialect = useRef(dialect);

  useEffect(() => {
    if (prevDialect.current === dialect) return;
    prevDialect.current = dialect;
    // If the form is still at its untouched default, re-seed the first
    // column to match the new dialect (INTEGER → SERIAL / INT etc.).
    setColumns((prev) => {
      const isPristine =
        prev.length === 2 &&
        prev[0].name === "id" &&
        prev[1].name === "" &&
        !prev[1].primaryKey &&
        !prev[0].check &&
        !prev[0].referencesTable;
      if (!isPristine) return prev;
      return [firstColumn(dialect), createEmptyColumn()];
    });
    if (dialect !== "sqlite") setWithoutRowid(false);
  }, [dialect]);

  const handleTableNameChange = (value: string) => {
    setTableName(value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
  };

  const handleColumnChange = useCallback((index: number, column: ColumnDef) => {
    setColumns((prev) => {
      const wasPk = prev[index]?.primaryKey ?? false;
      const becamePk = column.primaryKey && !wasPk;
      const next = prev.map((c, i) => {
        if (i === index) return column;
        if (becamePk && c.primaryKey) {
          return { ...c, primaryKey: false, autoIncrement: false };
        }
        return c;
      });
      return next;
    });
  }, []);

  const handleColumnRemove = useCallback((index: number) => {
    setColumns((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addColumn = () => {
    setColumns((prev) => [...prev, createEmptyColumn()]);
  };

  const validate = (): string | null => {
    if (!tableName.trim()) return "Table name is required";
    if (RESERVED_NAMES.has(tableName.toUpperCase()))
      return `"${tableName}" is a reserved SQL keyword`;
    const validCols = columns.filter((c) => c.name.trim());
    if (validCols.length === 0) return "At least one column is required";
    const names = new Set<string>();
    for (const col of validCols) {
      if (RESERVED_NAMES.has(col.name.toUpperCase()))
        return `Column "${col.name}" is a reserved SQL keyword`;
      if (names.has(col.name.toLowerCase()))
        return `Duplicate column name: "${col.name}"`;
      names.add(col.name.toLowerCase());
    }
    return null;
  };

  const handleCreate = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    let sql = generateCreateSQL(tableName, columns, {
      createIndexes,
      withoutRowid,
      dialect,
    });
    if (ifNotExists) {
      sql = sql.replace(/^CREATE TABLE /, "CREATE TABLE IF NOT EXISTS ");
    }
    setCreating(true);
    try {
      await onExecute(sql);
      toast.success(`Table "${tableName}" created`);
      setTableName("");
      setColumns([firstColumn(dialect), createEmptyColumn()]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
        <div className="space-y-2">
          <Label htmlFor="table-name" className="text-sm font-medium flex items-center gap-1.5">
            <TableProperties className="h-3.5 w-3.5 text-primary" />
            Table name
          </Label>
          <Input
            id="table-name"
            placeholder="my_table"
            value={tableName}
            onChange={(e) => handleTableNameChange(e.target.value)}
            className="font-mono max-w-xs"
          />
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Switch
              checked={ifNotExists}
              onCheckedChange={setIfNotExists}
              className="scale-75"
            />
            <span>IF NOT EXISTS</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Switch
              checked={createIndexes}
              onCheckedChange={setCreateIndexes}
              className="scale-75"
            />
            <span>Extra indexes</span>
          </label>
          {dialect === "sqlite" && (
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Switch
                checked={withoutRowid}
                onCheckedChange={setWithoutRowid}
                className="scale-75"
              />
              <span>WITHOUT ROWID</span>
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Columns</Label>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            Use the <kbd className="px-1 rounded bg-muted font-mono">⚙</kbd>{" "}
            and <kbd className="px-1 rounded bg-muted font-mono">🔗</kbd>{" "}
            buttons for advanced options
          </span>
        </div>
        <div className="space-y-2">
          {columns.map((col, i) => (
            <ColumnEditor
              key={i}
              column={col}
              index={i}
              tableNames={tableNames}
              dialect={dialect}
              onChange={handleColumnChange}
              onRemove={handleColumnRemove}
              canRemove={columns.length > 1}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addColumn}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add column
        </Button>
      </div>

      <SQLPreview
        tableName={tableName}
        columns={columns}
        createIndexes={createIndexes}
        withoutRowid={withoutRowid}
        dialect={dialect}
      />

      <Button
        onClick={handleCreate}
        disabled={creating}
        className="w-full sm:w-auto"
      >
        {creating ? "Creating..." : "Create table"}
      </Button>
    </div>
  );
}
