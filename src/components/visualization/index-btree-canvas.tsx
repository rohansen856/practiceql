"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TreePine, XCircle } from "lucide-react";
import { ColumnInfo, TableInfo, QueryResult } from "@/types/sql";
import {
  buildBTree,
  Cmp,
  layoutBTree,
  BTreeLayout,
} from "@/lib/visualization/btree";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";

interface IndexBTreeCanvasProps {
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  dialect: SqlDialect;
  executeSQL: (sql: string) => Promise<QueryResult[] | null | undefined>;
}

/**
 * Visualizes how a B-tree index over a user-chosen column might look.
 *
 * It is *indicative*, not literal: we sample up to 64 values from the column,
 * insert them into a textbook B+ tree of user-chosen order (3-6), and lay the
 * tree out on a static canvas. Duplicates are preserved because real indexes
 * allow them.
 */
export function IndexBTreeCanvas({
  tables,
  schemas,
  dialect,
  executeSQL,
}: IndexBTreeCanvasProps) {
  const [tableSelection, setTableSelection] = useState<string>("");
  const [columnSelection, setColumnSelection] = useState<string>("");
  const [order, setOrder] = useState<number>(4);
  const [sample, setSample] = useState<number>(32);
  const [keys, setKeys] = useState<Array<string | number>>([]);
  const [isNumeric, setIsNumeric] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive the effective selection: fall back to the first table and its PK
  // (or first column) until the user explicitly picks something else.
  const tableName = useMemo(() => {
    if (tableSelection && tables.some((t) => t.name === tableSelection)) {
      return tableSelection;
    }
    return tables[0]?.name ?? "";
  }, [tableSelection, tables]);

  const column = useMemo(() => {
    const cols = schemas[tableName] ?? [];
    if (cols.length === 0) return "";
    if (columnSelection && cols.some((c) => c.name === columnSelection)) {
      return columnSelection;
    }
    const pk = cols.find((c) => c.primaryKey);
    return pk?.name ?? cols[0].name;
  }, [tableName, schemas, columnSelection]);

  const loadKeys = useCallback(async () => {
    if (!tableName || !column) return;
    setLoading(true);
    setError(null);
    try {
      const sql = `SELECT ${quoteIdent(column, dialect)} AS k FROM ${quoteIdent(
        tableName,
        dialect,
      )} WHERE ${quoteIdent(column, dialect)} IS NOT NULL LIMIT ${sample}`;
      const results = await executeSQL(sql);
      const result = results && results.length > 0 ? results[results.length - 1] : null;
      if (!result || result.values.length === 0) {
        setKeys([]);
        return;
      }
      const raw = result.values.map((row) => row[0]);
      let numeric = true;
      const parsed = raw.map((v) => {
        if (typeof v === "number") return v;
        if (typeof v === "bigint") return Number(v);
        if (typeof v === "string") {
          const n = Number(v);
          if (!Number.isNaN(n) && v.trim() !== "") return n;
          numeric = false;
          return v;
        }
        if (v === null || v === undefined) {
          numeric = false;
          return "";
        }
        numeric = false;
        return String(v);
      });
      setIsNumeric(numeric);
      setKeys(parsed as Array<string | number>);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [tableName, column, dialect, sample, executeSQL]);

  useEffect(() => {
    // Pulling the sampled column values is a legitimate data-sync effect;
    // the setState calls inside `loadKeys` only happen after awaits resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadKeys();
  }, [loadKeys]);

  const layout = useMemo<BTreeLayout<string | number> | null>(() => {
    if (keys.length === 0) return null;
    const cmp: Cmp<string | number> = (a, b) => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      return String(a).localeCompare(String(b));
    };
    const tree = buildBTree(keys, order, cmp);
    return layoutBTree(tree, {
      keyWidth: isNumeric ? 42 : 64,
      keyHeight: 28,
      hGap: 18,
      vGap: 56,
    });
  }, [keys, order, isNumeric]);

  const readThemeColors = useCallback(() => {
    const cs = getComputedStyle(document.documentElement);
    const f = (v: string, d: string) => (v.trim() ? v : d);
    return {
      bg: f(cs.getPropertyValue("--background"), "#0b0b0f"),
      card: f(cs.getPropertyValue("--card"), "#12121a"),
      border: f(cs.getPropertyValue("--border"), "#2a2a3a"),
      fg: f(cs.getPropertyValue("--foreground"), "#e9e9f1"),
      muted: f(cs.getPropertyValue("--muted-foreground"), "#8a8a99"),
      primary: f(cs.getPropertyValue("--primary"), "#10b981"),
      violet: "#a78bfa",
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = readThemeColors();

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    if (!layout) {
      ctx.fillStyle = colors.muted;
      ctx.font = "500 12px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        keys.length === 0
          ? "No sample keys available for this column."
          : "Pick a table and column to build a tree.",
        w / 2,
        h / 2,
      );
      return;
    }

    // Auto-fit layout into container.
    const pad = 24;
    const sx = (w - pad * 2) / Math.max(1, layout.width);
    const sy = (h - pad * 2) / Math.max(1, layout.height);
    const scale = Math.min(1, sx, sy);

    const offX =
      (w - layout.width * scale) / 2 -
      Math.min(...layout.nodes.map((n) => n.x)) * scale;
    const offY = pad;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);

    // edges first
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    for (const e of layout.edges) {
      ctx.beginPath();
      ctx.moveTo(e.from.x, e.from.y);
      const midY = (e.from.y + e.to.y) / 2;
      ctx.bezierCurveTo(e.from.x, midY, e.to.x, midY, e.to.x, e.to.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // nodes
    ctx.font = "600 12px ui-monospace, SFMono-Regular, monospace";
    ctx.textBaseline = "middle";
    for (const n of layout.nodes) {
      const { node } = n;
      // node box
      ctx.fillStyle = node.leaf ? colors.card : colors.card;
      ctx.strokeStyle = node.leaf ? colors.primary : colors.violet;
      ctx.lineWidth = 1.5;
      roundRect(ctx, n.x, n.y, n.width, n.height, 6);
      ctx.fill();
      ctx.stroke();

      // cell separators + keys
      const cellW = n.width / Math.max(1, node.keys.length);
      for (let i = 0; i < node.keys.length; i++) {
        const cx = n.x + i * cellW + cellW / 2;
        if (i > 0) {
          ctx.strokeStyle = colors.border;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(n.x + i * cellW, n.y + 4);
          ctx.lineTo(n.x + i * cellW, n.y + n.height - 4);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = colors.fg;
        ctx.textAlign = "center";
        const label = formatKey(node.keys[i]);
        ctx.fillText(ellipsize(ctx, label, cellW - 6), cx, n.y + n.height / 2);
      }

      // depth badge on left
      ctx.fillStyle = node.leaf ? colors.primary : colors.violet;
      ctx.globalAlpha = 0.15;
      roundRect(ctx, n.x - 4, n.y, 4, n.height, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // legend
    ctx.fillStyle = colors.muted;
    ctx.font = "500 11px ui-sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(
      `order=${order} · ${layout.nodes.length} nodes · ${keys.length} keys`,
      12,
      h - 12,
    );
  }, [layout, readThemeColors, order, keys.length]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const columns = schemas[tableName] ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-md bg-muted/20">
        <div className="space-y-1">
          <Label className="text-[11px]">Table</Label>
          <Select
            value={tableName}
            onValueChange={(v) => setTableSelection(v ?? "")}
          >
            <SelectTrigger className="h-8 text-xs min-w-[160px]">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((t) => (
                <SelectItem key={t.name} value={t.name} className="font-mono">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Column</Label>
          <Select
            value={column}
            onValueChange={(v) => setColumnSelection(v ?? "")}
            disabled={columns.length === 0}
          >
            <SelectTrigger className="h-8 text-xs min-w-[160px]">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((c) => (
                <SelectItem key={c.name} value={c.name} className="font-mono">
                  {c.name}
                  {c.primaryKey ? " · PK" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Tree order</Label>
          <Input
            type="number"
            min={3}
            max={6}
            value={order}
            onChange={(e) =>
              setOrder(Math.min(6, Math.max(3, Number(e.target.value) || 4)))
            }
            className="h-8 text-xs w-20"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Sample size</Label>
          <Input
            type="number"
            min={4}
            max={128}
            value={sample}
            onChange={(e) =>
              setSample(Math.min(128, Math.max(4, Number(e.target.value) || 32)))
            }
            className="h-8 text-xs w-20"
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void loadKeys()}
          className="gap-1.5"
          disabled={loading || !tableName || !column}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <TreePine className="h-3.5 w-3.5" />
          )}
          Rebuild
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>Could not sample column</AlertTitle>
          <AlertDescription className="break-all">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0 relative" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full rounded-md border block" />
      </div>
    </div>
  );
}

function formatKey(k: string | number): string {
  if (typeof k === "number") {
    if (Number.isInteger(k)) return String(k);
    return k.toFixed(2);
  }
  return String(k);
}

function ellipsize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
