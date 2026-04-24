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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Play, XCircle } from "lucide-react";
import { ColumnInfo, ForeignKeyInfo, QueryResult, TableInfo } from "@/types/sql";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";
import {
  monoFont,
  resolveCanvasColors,
  sansFont,
} from "@/lib/visualization/theme";

interface JoinCanvasProps {
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  foreignKeys: Record<string, ForeignKeyInfo[]>;
  dialect: SqlDialect;
  executeSQL: (sql: string) => Promise<QueryResult[] | null | undefined>;
}

type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";

interface JoinCandidate {
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
  label: string;
}

const ROW_LIMIT = 12;

/**
 * Visualises how a JOIN composes two tables.
 *
 * We pick a foreign-key relationship, load up to 12 rows from each side, then
 * draw each side as a vertical stack of keyed rows with lines connecting the
 * matching keys. The chosen join type determines which unmatched rows are
 * shown (LEFT keeps left-only, RIGHT keeps right-only, FULL keeps both,
 * INNER drops them).
 */
export function JoinCanvas({
  tables,
  schemas,
  foreignKeys,
  dialect,
  executeSQL,
}: JoinCanvasProps) {
  const candidates = useMemo<JoinCandidate[]>(() => {
    const out: JoinCandidate[] = [];
    for (const [fromTable, fks] of Object.entries(foreignKeys)) {
      for (const fk of fks) {
        out.push({
          fromTable,
          fromCol: fk.column,
          toTable: fk.refTable,
          toCol: fk.refColumn,
          label: `${fromTable}.${fk.column} → ${fk.refTable}.${fk.refColumn}`,
        });
      }
    }
    return out;
  }, [foreignKeys]);

  const [selectedPick, setSelectedPick] = useState<string>("");
  const [joinType, setJoinType] = useState<JoinType>("INNER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftRows, setLeftRows] = useState<Array<{ key: string; label: string }>>([]);
  const [rightRows, setRightRows] = useState<Array<{ key: string; label: string }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    if (selectedPick && candidates.some((c) => c.label === selectedPick)) {
      return selectedPick;
    }
    return candidates[0]?.label ?? "";
  }, [selectedPick, candidates]);

  const selectedCandidate = candidates.find((c) => c.label === selected) ?? null;

  const loadRows = useCallback(async () => {
    if (!selectedCandidate) return;
    setLoading(true);
    setError(null);
    try {
      const leftCols = schemas[selectedCandidate.fromTable] ?? [];
      const rightCols = schemas[selectedCandidate.toTable] ?? [];
      const leftDisplay =
        leftCols.find((c) => !c.primaryKey && c.name !== selectedCandidate.fromCol)
          ?.name ?? selectedCandidate.fromCol;
      const rightDisplay =
        rightCols.find((c) => !c.primaryKey && c.name !== selectedCandidate.toCol)
          ?.name ?? selectedCandidate.toCol;

      const leftSql = `SELECT ${quoteIdent(
        selectedCandidate.fromCol,
        dialect,
      )} AS k, ${quoteIdent(leftDisplay, dialect)} AS v FROM ${quoteIdent(
        selectedCandidate.fromTable,
        dialect,
      )} LIMIT ${ROW_LIMIT}`;
      const rightSql = `SELECT ${quoteIdent(
        selectedCandidate.toCol,
        dialect,
      )} AS k, ${quoteIdent(rightDisplay, dialect)} AS v FROM ${quoteIdent(
        selectedCandidate.toTable,
        dialect,
      )} LIMIT ${ROW_LIMIT}`;

      const [leftRes, rightRes] = await Promise.all([
        executeSQL(leftSql),
        executeSQL(rightSql),
      ]);
      const lastOf = (arr: QueryResult[] | null | undefined) =>
        arr && arr.length > 0 ? arr[arr.length - 1] : null;

      const toEntries = (res: QueryResult | null | undefined) =>
        (res?.values ?? []).map((row) => ({
          key: row[0] === null || row[0] === undefined ? "" : String(row[0]),
          label:
            row[1] === null || row[1] === undefined
              ? ""
              : String(row[1]).slice(0, 20),
        }));

      setLeftRows(toEntries(lastOf(leftRes)));
      setRightRows(toEntries(lastOf(rightRes)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLeftRows([]);
      setRightRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCandidate, schemas, dialect, executeSQL]);

  useEffect(() => {
    // Legitimate data-sync effect: setState calls inside `loadRows` only
    // happen after awaits resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRows();
  }, [loadRows]);

  const readThemeColors = useCallback(() => resolveCanvasColors(), []);

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

    if (!selectedCandidate) {
      ctx.fillStyle = colors.muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = sansFont(500, 12);
      ctx.fillText(
        "Add foreign keys between tables to visualise joins.",
        w / 2,
        h / 2,
      );
      return;
    }

    // column geometry
    const colWidth = Math.min(260, (w - 80) / 2);
    const rowHeight = 30;
    const topPad = 56;
    const leftX = 24;
    const rightX = w - colWidth - 24;

    // headers
    ctx.fillStyle = colors.fg;
    ctx.font = sansFont(700, 13);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(selectedCandidate.fromTable, leftX, 24);
    ctx.fillText(selectedCandidate.toTable, rightX, 24);

    ctx.fillStyle = colors.muted;
    ctx.font = monoFont(500, 11);
    ctx.fillText(
      `${selectedCandidate.fromCol} (join key)`,
      leftX,
      42,
    );
    ctx.textAlign = "left";
    ctx.fillText(
      `${selectedCandidate.toCol} (join key)`,
      rightX,
      42,
    );

    // compute match matrix
    const matches: Array<{ li: number; ri: number }> = [];
    const leftMatched = new Set<number>();
    const rightMatched = new Set<number>();
    leftRows.forEach((l, li) => {
      rightRows.forEach((r, ri) => {
        if (l.key === r.key && l.key !== "") {
          matches.push({ li, ri });
          leftMatched.add(li);
          rightMatched.add(ri);
        }
      });
    });

    // Row visibility per join type
    const showLeft = (li: number) => {
      if (joinType === "INNER" || joinType === "RIGHT") return leftMatched.has(li);
      return true;
    };
    const showRight = (ri: number) => {
      if (joinType === "INNER" || joinType === "LEFT") return rightMatched.has(ri);
      return true;
    };

    // draw rows
    const drawRow = (
      x: number,
      index: number,
      entry: { key: string; label: string },
      matched: boolean,
      visible: boolean,
    ) => {
      const y = topPad + index * rowHeight;
      ctx.fillStyle = colors.card;
      ctx.strokeStyle = matched
        ? colors.primary
        : visible
          ? colors.amber
          : colors.slate;
      ctx.globalAlpha = visible ? 1 : 0.35;
      ctx.lineWidth = matched ? 1.5 : 1;
      roundRect(ctx, x, y, colWidth, rowHeight - 4, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.fg;
      ctx.font = monoFont(600, 11);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        String(entry.key),
        x + 10,
        y + (rowHeight - 4) / 2,
      );

      ctx.fillStyle = colors.muted;
      ctx.font = sansFont(500, 11);
      ctx.textAlign = "right";
      const label = entry.label.length > 22 ? entry.label.slice(0, 22) + "…" : entry.label;
      ctx.fillText(label, x + colWidth - 10, y + (rowHeight - 4) / 2);

      ctx.globalAlpha = 1;
    };

    leftRows.forEach((row, i) => {
      drawRow(leftX, i, row, leftMatched.has(i), showLeft(i));
    });
    rightRows.forEach((row, i) => {
      drawRow(rightX, i, row, rightMatched.has(i), showRight(i));
    });

    // connecting lines
    for (const m of matches) {
      const ax = leftX + colWidth;
      const ay = topPad + m.li * rowHeight + (rowHeight - 4) / 2;
      const bx = rightX;
      const by = topPad + m.ri * rowHeight + (rowHeight - 4) / 2;
      const cp = (ax + bx) / 2;
      ctx.strokeStyle = colors.primary;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.bezierCurveTo(cp, ay, cp, by, bx, by);
      ctx.stroke();
      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // footer counts
    const resultRows =
      joinType === "INNER"
        ? matches.length
        : joinType === "LEFT"
          ? leftRows.length
          : joinType === "RIGHT"
            ? rightRows.length
            : leftRows.length +
              rightRows.filter((_, i) => !rightMatched.has(i)).length;

    ctx.fillStyle = colors.muted;
    ctx.font = sansFont(500, 11);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      `${joinType} JOIN preview · ${matches.length} matches · ~${resultRows} result row${resultRows === 1 ? "" : "s"} (preview of first ${ROW_LIMIT})`,
      w / 2,
      h - 12,
    );
  }, [readThemeColors, selectedCandidate, leftRows, rightRows, joinType]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  if (candidates.length === 0) {
    return (
      <Alert>
        <AlertTitle>No foreign-key relationships yet</AlertTitle>
        <AlertDescription>
          Add foreign keys between tables (via Schema Builder) to preview how
          SQL joins combine them. The active database has {tables.length} table
          {tables.length === 1 ? "" : "s"} but no FK constraints.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-md bg-muted/20">
        <div className="space-y-1 min-w-[280px]">
          <Label className="text-[11px]">Foreign key</Label>
          <Select value={selected} onValueChange={(v) => setSelectedPick(v ?? "")}>
            <SelectTrigger className="h-8 text-xs font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.label} value={c.label} className="font-mono">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">Join type</Label>
          <Select
            value={joinType}
            onValueChange={(v) => setJoinType((v as JoinType) ?? "INNER")}
          >
            <SelectTrigger className="h-8 text-xs min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INNER">INNER JOIN</SelectItem>
              <SelectItem value="LEFT">LEFT JOIN</SelectItem>
              <SelectItem value="RIGHT">RIGHT JOIN</SelectItem>
              <SelectItem value="FULL">FULL OUTER JOIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void loadRows()}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>Could not load rows</AlertTitle>
          <AlertDescription className="break-all">{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex-1 min-h-0 relative" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full rounded-md border block" />
      </div>
    </div>
  );
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
