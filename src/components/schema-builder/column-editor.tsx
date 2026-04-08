"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Trash2,
  GripVertical,
  KeyRound,
  Shield,
  Hash,
  Settings2,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  defaultCollates,
  defaultColumnTypes,
  defaultForeignKeyType,
  isIntegerType,
  type SqlDialect,
} from "@/lib/sql/dialect";

export interface ColumnDef {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  unique: boolean;
  autoIncrement: boolean;
  defaultValue: string;
  check: string;
  collate: string;
  generatedExpr: string;
  generatedStored: boolean;
  referencesTable: string;
  referencesColumn: string;
  onDelete: "" | "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
  onUpdate: "" | "CASCADE" | "SET NULL" | "SET DEFAULT" | "RESTRICT" | "NO ACTION";
}

export const createEmptyColumn = (): ColumnDef => ({
  name: "",
  type: "TEXT",
  primaryKey: false,
  notNull: false,
  unique: false,
  autoIncrement: false,
  defaultValue: "",
  check: "",
  collate: "",
  generatedExpr: "",
  generatedStored: false,
  referencesTable: "",
  referencesColumn: "",
  onDelete: "",
  onUpdate: "",
});

interface ColumnEditorProps {
  column: ColumnDef;
  index: number;
  tableNames: string[];
  dialect?: SqlDialect;
  onChange: (index: number, column: ColumnDef) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function ColumnEditor({
  column,
  index,
  tableNames,
  dialect = "sqlite",
  onChange,
  onRemove,
  canRemove,
}: ColumnEditorProps) {
  const typeGroups = defaultColumnTypes(dialect);
  const collateOptions = defaultCollates(dialect);
  const autoIncrementLabel =
    dialect === "mysql"
      ? "AUTO_INCREMENT"
      : dialect === "postgresql"
        ? "SERIAL (auto-generated)"
        : "AUTOINCREMENT";
  const autoIncrementHint =
    dialect === "mysql"
      ? "Integer PK only; MySQL assigns sequential ids"
      : dialect === "postgresql"
        ? "Emits SERIAL/BIGSERIAL in CREATE TABLE"
        : "Never reuse ids (rarely needed)";
  const update = <K extends keyof ColumnDef>(field: K, value: ColumnDef[K]) => {
    const updated = { ...column, [field]: value };
    if (field === "primaryKey" && value === true) {
      updated.notNull = true;
    }
    if (field === "primaryKey" && value === false) {
      updated.autoIncrement = false;
    }
    // When a foreign-key target is chosen, assume an INTEGER id column unless
    // the user has already customised things. Also default the referenced
    // column to "id" so the SQL is actually valid.
    if (
      field === "referencesTable" &&
      typeof value === "string" &&
      value.trim() !== "" &&
      column.referencesTable.trim() === ""
    ) {
      if (!updated.referencesColumn.trim()) {
        updated.referencesColumn = "id";
      }
      const defaultTextTypes = new Set([
        "TEXT",
        "VARCHAR(255)",
        "CHAR(10)",
        "",
      ]);
      if (defaultTextTypes.has(updated.type)) {
        updated.type = defaultForeignKeyType(dialect);
      }
    }
    onChange(index, updated);
  };

  const hasFK = !!column.referencesTable.trim();
  const hasCheck = !!column.check.trim();
  const hasDefault = !!column.defaultValue.trim();
  const hasGenerated = !!column.generatedExpr.trim();
  const advancedActive = hasCheck || !!column.collate || hasGenerated;

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-start gap-2 p-3">
        <GripVertical className="h-4 w-4 mt-2.5 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <Input
            placeholder="column_name"
            value={column.name}
            onChange={(e) =>
              update("name", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
            }
            className="font-mono text-sm h-9 flex-1 min-w-[180px] basis-[220px]"
          />

          <Select value={column.type} onValueChange={(v) => update("type", v ?? "")}>
            <SelectTrigger className="h-9 text-sm font-mono w-[140px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeGroups.map((g) => (
                <SelectGroup key={g.label}>
                  <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {g.label}
                  </SelectLabel>
                  {g.types.map((t) => (
                    <SelectItem key={t} value={t} className="font-mono text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 shrink-0">
            <ToggleChip
              id={`pk-${index}`}
              icon={<KeyRound className="h-3 w-3" />}
              label="PK"
              tone="amber"
              active={column.primaryKey}
              onChange={(v) => update("primaryKey", v)}
            />

            <ToggleChip
              id={`nn-${index}`}
              icon={<Shield className="h-3 w-3" />}
              label="NOT NULL"
              tone="sky"
              active={column.notNull}
              disabled={column.primaryKey}
              onChange={(v) => update("notNull", v)}
            />

            <ToggleChip
              id={`uq-${index}`}
              icon={<Hash className="h-3 w-3" />}
              label="UNIQUE"
              tone="emerald"
              active={column.unique}
              onChange={(v) => update("unique", v)}
            />
          </div>

          <Input
            placeholder="DEFAULT"
            value={column.defaultValue}
            onChange={(e) => update("defaultValue", e.target.value)}
            className="font-mono text-sm h-9 w-[120px] shrink-0"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Popover>
            <PopoverTrigger
              title="Advanced"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                advancedActive && "text-primary bg-primary/10",
              )}
            >
              <Settings2 className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b">
                <p className="text-xs font-semibold">Advanced constraints</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  CHECK, COLLATE, GENERATED, {autoIncrementLabel}
                </p>
              </div>
              <div className="p-3 space-y-3">
                {column.primaryKey && isIntegerType(column.type, dialect) && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Label
                        htmlFor={`ai-${index}`}
                        className="text-xs font-medium"
                      >
                        {autoIncrementLabel}
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        {autoIncrementHint}
                      </p>
                    </div>
                    <Switch
                      id={`ai-${index}`}
                      checked={column.autoIncrement}
                      onCheckedChange={(v) => update("autoIncrement", v)}
                      className="scale-90 shrink-0"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label
                    htmlFor={`chk-${index}`}
                    className="text-xs font-medium"
                  >
                    CHECK expression
                  </Label>
                  <Input
                    id={`chk-${index}`}
                    placeholder="price > 0"
                    value={column.check}
                    onChange={(e) => update("check", e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor={`col-${index}`}
                    className="text-xs font-medium"
                  >
                    COLLATE
                  </Label>
                  <Select
                    value={column.collate || "none"}
                    onValueChange={(v) => update("collate", v === "none" ? "" : v)}
                  >
                    <SelectTrigger
                      id={`col-${index}`}
                      className="h-8 text-xs font-mono"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">(none)</SelectItem>
                      {collateOptions.map((c) => (
                        <SelectItem key={c} value={c} className="font-mono text-xs">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 border-t pt-3">
                  <Label
                    htmlFor={`gen-${index}`}
                    className="text-xs font-medium"
                  >
                    GENERATED expression
                  </Label>
                  <Input
                    id={`gen-${index}`}
                    placeholder="first_name || ' ' || last_name"
                    value={column.generatedExpr}
                    onChange={(e) => update("generatedExpr", e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                  {hasGenerated && dialect !== "postgresql" && (
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`gen-stored-${index}`}
                        className="text-[11px] text-muted-foreground"
                      >
                        Stored (vs Virtual)
                      </Label>
                      <Switch
                        id={`gen-stored-${index}`}
                        checked={column.generatedStored}
                        onCheckedChange={(v) => update("generatedStored", v)}
                        className="scale-90"
                      />
                    </div>
                  )}
                  {hasGenerated && dialect === "postgresql" && (
                    <p className="text-[10px] text-muted-foreground">
                      Postgres only supports STORED generated columns.
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger
              title="Foreign key"
              disabled={tableNames.length === 0}
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
                hasFK && "text-primary bg-primary/10",
              )}
            >
              <Link2 className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b">
                <p className="text-xs font-semibold">Foreign key</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  REFERENCES another table
                </p>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Table</Label>
                    <Select
                      value={column.referencesTable || "none"}
                      onValueChange={(v) =>
                        update("referencesTable", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(none)</SelectItem>
                        {tableNames.map((t) => (
                          <SelectItem key={t} value={t} className="font-mono">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Column</Label>
                    <Input
                      value={column.referencesColumn}
                      onChange={(e) =>
                        update(
                          "referencesColumn",
                          e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                        )
                      }
                      placeholder="id"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">ON DELETE</Label>
                    <Select
                      value={column.onDelete || "none"}
                      onValueChange={(v) =>
                        update(
                          "onDelete",
                          (v === "none" ? "" : v) as ColumnDef["onDelete"],
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(none)</SelectItem>
                        <SelectItem value="CASCADE">CASCADE</SelectItem>
                        <SelectItem value="SET NULL">SET NULL</SelectItem>
                        <SelectItem value="SET DEFAULT">SET DEFAULT</SelectItem>
                        <SelectItem value="RESTRICT">RESTRICT</SelectItem>
                        <SelectItem value="NO ACTION">NO ACTION</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">ON UPDATE</Label>
                    <Select
                      value={column.onUpdate || "none"}
                      onValueChange={(v) =>
                        update(
                          "onUpdate",
                          (v === "none" ? "" : v) as ColumnDef["onUpdate"],
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(none)</SelectItem>
                        <SelectItem value="CASCADE">CASCADE</SelectItem>
                        <SelectItem value="SET NULL">SET NULL</SelectItem>
                        <SelectItem value="SET DEFAULT">SET DEFAULT</SelectItem>
                        <SelectItem value="RESTRICT">RESTRICT</SelectItem>
                        <SelectItem value="NO ACTION">NO ACTION</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(hasFK || hasCheck || hasDefault || hasGenerated || column.collate) && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2 border-t pt-2 text-[10px] text-muted-foreground">
          {hasDefault && (
            <span className="px-1.5 py-0.5 rounded border bg-muted font-mono">
              DEFAULT {column.defaultValue}
            </span>
          )}
          {hasCheck && (
            <span className="px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 font-mono">
              CHECK ({column.check})
            </span>
          )}
          {hasGenerated && (
            <span className="px-1.5 py-0.5 rounded border bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20 font-mono">
              GENERATED {column.generatedStored ? "STORED" : "VIRTUAL"}
            </span>
          )}
          {column.collate && (
            <span className="px-1.5 py-0.5 rounded border bg-muted font-mono">
              COLLATE {column.collate}
            </span>
          )}
          {hasFK && (
            <span className="px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20 font-mono">
              → {column.referencesTable}
              {column.referencesColumn ? `(${column.referencesColumn})` : ""}
            </span>
          )}
          {column.autoIncrement && (
            <span className="px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-mono">
              {autoIncrementLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface ToggleChipProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  tone: "amber" | "sky" | "emerald";
  active: boolean;
  disabled?: boolean;
  onChange: (active: boolean) => void;
}

const TONE: Record<ToggleChipProps["tone"], string> = {
  amber:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  emerald:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

function ToggleChip({
  id,
  icon,
  label,
  tone,
  active,
  disabled,
  onChange,
}: ToggleChipProps) {
  return (
    <button
      type="button"
      id={id}
      disabled={disabled}
      aria-pressed={active}
      onClick={() => onChange(!active)}
      className={cn(
        "h-9 px-2.5 flex items-center gap-1.5 rounded-md border text-[11px] font-medium whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        active
          ? TONE[tone]
          : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
