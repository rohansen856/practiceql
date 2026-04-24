"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColumnInfo, ForeignKeyInfo, TableInfo } from "@/types/sql";
import {
  buildErdModel,
  ERD_CONSTANTS,
  ErdEdge,
  ErdNode,
  layoutErd,
} from "@/lib/visualization/erd-layout";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import {
  monoFont,
  resolveCanvasColors,
  sansFont,
  type CanvasThemeColors,
} from "@/lib/visualization/theme";

interface SchemaCanvasProps {
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  foreignKeys: Record<string, ForeignKeyInfo[]>;
}

/**
 * Foreign-key aware ERD rendered on a plain 2D canvas.
 * - Tables are auto-laid out into groups of connected components.
 * - Drag a table header to reposition it.
 * - Mouse-wheel zooms around the cursor; click-drag empty space to pan.
 */
export function SchemaCanvas({
  tables,
  schemas,
  foreignKeys,
}: SchemaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const model = useMemo(
    () => buildErdModel(tables, schemas, foreignKeys),
    [tables, schemas, foreignKeys],
  );

  // Layout from the model is derived state; drag interactions are stored
  // separately as per-table overrides so that schema changes don't wipe the
  // user's manual placement.
  const baseNodes = useMemo(
    () => layoutErd(model.tables, model.edges),
    [model],
  );
  const [overrides, setOverrides] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const nodes = useMemo(
    () =>
      baseNodes.map((n) =>
        overrides[n.name] ? { ...n, ...overrides[n.name] } : n,
      ),
    [baseNodes, overrides],
  );
  const [viewport, setViewport] = useState({ x: 24, y: 24, scale: 1 });

  // Theme colors live in a shared helper so every visualization canvas stays
  // in sync with the DOM.
  const readThemeColors = useCallback(() => resolveCanvasColors(), []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = readThemeColors();
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    // grid backdrop
    ctx.save();
    ctx.strokeStyle = colors.border;
    ctx.globalAlpha = 0.25;
    const gridSize = 24 * viewport.scale;
    if (gridSize > 6) {
      const ox = viewport.x % gridSize;
      const oy = viewport.y % gridSize;
      ctx.beginPath();
      for (let x = ox; x < w; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = oy; y < h; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.scale, viewport.scale);

    drawEdges(ctx, nodes, model.edges, colors);
    drawTables(ctx, nodes, colors);

    ctx.restore();
  }, [model.edges, nodes, readThemeColors, viewport]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  // Drag state
  const dragRef = useRef<
    | { kind: "none" }
    | { kind: "node"; name: string; offsetX: number; offsetY: number }
    | { kind: "pan"; startX: number; startY: number; origX: number; origY: number }
  >({ kind: "none" });

  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (clientX - rect.left - viewport.x) / viewport.scale;
    const y = (clientY - rect.top - viewport.y) / viewport.scale;
    return { x, y };
  };

  const hitNode = (x: number, y: number) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (
        x >= n.x &&
        x <= n.x + n.width &&
        y >= n.y &&
        y <= n.y + ERD_CONSTANTS.HEADER_HEIGHT
      ) {
        return i;
      }
    }
    return -1;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toWorld(e.clientX, e.clientY);
    const idx = hitNode(x, y);
    if (idx >= 0) {
      const n = nodes[idx];
      dragRef.current = {
        kind: "node",
        name: n.name,
        offsetX: x - n.x,
        offsetY: y - n.y,
      };
    } else {
      dragRef.current = {
        kind: "pan",
        startX: e.clientX,
        startY: e.clientY,
        origX: viewport.x,
        origY: viewport.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (d.kind === "node") {
      const { x, y } = toWorld(e.clientX, e.clientY);
      setOverrides((prev) => ({
        ...prev,
        [d.name]: { x: x - d.offsetX, y: y - d.offsetY },
      }));
    } else if (d.kind === "pan") {
      setViewport((v) => ({
        ...v,
        x: d.origX + (e.clientX - d.startX),
        y: d.origY + (e.clientY - d.startY),
      }));
    } else {
      // hover cursor
      const { x, y } = toWorld(e.clientX, e.clientY);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = hitNode(x, y) >= 0 ? "grab" : "default";
      }
    }
  };

  const endDrag = () => {
    dragRef.current = { kind: "none" };
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY;
    const factor = Math.exp(delta * 0.0015);
    setViewport((v) => {
      const newScale = Math.min(2.5, Math.max(0.3, v.scale * factor));
      const wx = (mx - v.x) / v.scale;
      const wy = (my - v.y) / v.scale;
      return {
        scale: newScale,
        x: mx - wx * newScale,
        y: my - wy * newScale,
      };
    });
  };

  const fitToView = () => {
    const container = containerRef.current;
    if (!container || nodes.length === 0) return;
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + n.width));
    const maxY = Math.max(...nodes.map((n) => n.y + n.height));
    const pad = 32;
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const scale = Math.min(
      container.clientWidth / contentW,
      container.clientHeight / contentH,
      1.25,
    );
    setViewport({
      scale,
      x: (container.clientWidth - (maxX - minX) * scale) / 2 - minX * scale,
      y: (container.clientHeight - (maxY - minY) * scale) / 2 - minY * scale,
    });
  };

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-md border block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onWheel={handleWheel}
      />
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={() =>
            setViewport((v) => ({
              ...v,
              scale: Math.min(2.5, v.scale * 1.2),
            }))
          }
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={() =>
            setViewport((v) => ({
              ...v,
              scale: Math.max(0.3, v.scale / 1.2),
            }))
          }
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={fitToView}
          title="Fit to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground font-mono bg-background/70 backdrop-blur px-2 py-0.5 rounded border">
        {Math.round(viewport.scale * 100)}% · {nodes.length} table
        {nodes.length === 1 ? "" : "s"} · {model.edges.length} FK edge
        {model.edges.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

/* ----- drawing helpers ----- */

function drawTables(
  ctx: CanvasRenderingContext2D,
  nodes: ErdNode[],
  colors: CanvasThemeColors,
) {
  ctx.font = sansFont(600, 12);
  ctx.textBaseline = "middle";

  for (const n of nodes) {
    // card
    ctx.fillStyle = colors.card;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, n.x, n.y, n.width, n.height, 10);
    ctx.fill();
    ctx.stroke();

    // Header: subtle translucent tint so the table name reads clearly on top.
    // We use `globalAlpha` rather than a hex-alpha suffix because shadcn
    // theme colours are `lab(...)` values and cannot be concatenated with an
    // alpha channel.
    ctx.save();
    roundRect(ctx, n.x, n.y, n.width, ERD_CONSTANTS.HEADER_HEIGHT, 10);
    ctx.clip();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = colors.violet;
    ctx.fillRect(n.x, n.y, n.width, ERD_CONSTANTS.HEADER_HEIGHT);
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = colors.primary;
    ctx.fillRect(n.x, n.y, n.width, ERD_CONSTANTS.HEADER_HEIGHT);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Crisp divider between header and body so the tinted band doesn't
    // visually bleed into the first column row.
    ctx.strokeStyle = colors.border;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(n.x, n.y + ERD_CONSTANTS.HEADER_HEIGHT);
    ctx.lineTo(n.x + n.width, n.y + ERD_CONSTANTS.HEADER_HEIGHT);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Table name. Compute how much horizontal room the "N cols" chip on the
    // right is going to consume so we can truncate a long name with an
    // ellipsis rather than letting it paint over the chip.
    ctx.font = monoFont(500, 10);
    const colLabel = `${n.columns.length} col${n.columns.length === 1 ? "" : "s"}`;
    const colLabelWidth = ctx.measureText(colLabel).width;
    const nameMaxWidth = n.width - 24 - colLabelWidth - 10;

    ctx.fillStyle = colors.fg;
    ctx.font = sansFont(700, 13);
    ctx.textAlign = "left";
    const displayName = fitText(ctx, n.name, nameMaxWidth);
    ctx.fillText(displayName, n.x + 12, n.y + ERD_CONSTANTS.HEADER_HEIGHT / 2);

    ctx.fillStyle = colors.muted;
    ctx.font = monoFont(500, 10);
    ctx.fillText(
      colLabel,
      n.x + n.width - colLabelWidth - 12,
      n.y + ERD_CONSTANTS.HEADER_HEIGHT / 2,
    );

    // columns
    ctx.font = monoFont(500, 11);
    for (let i = 0; i < n.columns.length; i++) {
      const col = n.columns[i];
      const y =
        n.y +
        ERD_CONSTANTS.HEADER_HEIGHT +
        i * ERD_CONSTANTS.ROW_HEIGHT +
        ERD_CONSTANTS.ROW_HEIGHT / 2;

      // row separator
      if (i > 0) {
        ctx.strokeStyle = colors.border;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(n.x, y - ERD_CONSTANTS.ROW_HEIGHT / 2);
        ctx.lineTo(n.x + n.width, y - ERD_CONSTANTS.ROW_HEIGHT / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // icon badge
      const badgeX = n.x + 10;
      if (col.primaryKey) {
        drawBadge(ctx, badgeX, y, "PK", colors.amber);
      } else if (n.fkCols.has(col.name)) {
        drawBadge(ctx, badgeX, y, "FK", colors.primary);
      } else if (n.targetCols.has(col.name)) {
        drawBadge(ctx, badgeX, y, "•", colors.violet);
      } else {
        drawBadge(ctx, badgeX, y, "", colors.muted);
      }

      // Reserve ~40% of the row for the type label on the right, then fit
      // the column name into whatever remains so nothing overflows the card.
      const nameStartX = badgeX + 28;
      const typeRightX = n.x + n.width - 10;
      const rawType = col.type || "ANY";
      const typeWidth = Math.min(
        ctx.measureText(rawType).width,
        (n.width - 28 - 20) * 0.5,
      );
      const nameWidth = typeRightX - typeWidth - 12 - nameStartX;

      ctx.fillStyle = colors.fg;
      ctx.textAlign = "left";
      ctx.fillText(fitText(ctx, col.name, nameWidth), nameStartX, y);

      ctx.fillStyle = colors.muted;
      ctx.textAlign = "right";
      ctx.fillText(fitText(ctx, rawType, typeWidth), typeRightX, y);
    }
  }
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string,
) {
  ctx.save();
  const w = 22;
  const h = 14;
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = color;
  roundRect(ctx, x, y - h / 2, w, h, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y - h / 2, w, h, 4);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = sansFont(700, 9);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + 0.5);
  ctx.restore();
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  nodes: ErdNode[],
  edges: ErdEdge[],
  colors: CanvasThemeColors,
) {
  const byName = new Map(nodes.map((n) => [n.name, n]));
  for (const e of edges) {
    const a = byName.get(e.from);
    const b = byName.get(e.to);
    if (!a || !b) continue;
    const colA = a.columns.findIndex((c) => c.name === e.fromCol);
    const colB = b.columns.findIndex((c) => c.name === e.toCol);
    if (colA < 0 || colB < 0) continue;

    const aY =
      a.y +
      ERD_CONSTANTS.HEADER_HEIGHT +
      colA * ERD_CONSTANTS.ROW_HEIGHT +
      ERD_CONSTANTS.ROW_HEIGHT / 2;
    const bY =
      b.y +
      ERD_CONSTANTS.HEADER_HEIGHT +
      colB * ERD_CONSTANTS.ROW_HEIGHT +
      ERD_CONSTANTS.ROW_HEIGHT / 2;

    // Pick the side that gives a shorter horizontal path.
    const aCenterX = a.x + a.width / 2;
    const bCenterX = b.x + b.width / 2;
    const aRight = aCenterX < bCenterX;
    const aX = aRight ? a.x + a.width : a.x;
    const bX = aRight ? b.x : b.x + b.width;

    const dx = Math.max(40, Math.abs(bX - aX) * 0.45);
    const cp1X = aRight ? aX + dx : aX - dx;
    const cp2X = aRight ? bX - dx : bX + dx;

    ctx.strokeStyle = colors.primary;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(aX, aY);
    ctx.bezierCurveTo(cp1X, aY, cp2X, bY, bX, bY);
    ctx.stroke();

    // endpoint dots
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(aX, aY, 3, 0, Math.PI * 2);
    ctx.fill();
    // arrow at target
    const dir = aRight ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(bX, bY);
    ctx.lineTo(bX + 7 * dir, bY - 4);
    ctx.lineTo(bX + 7 * dir, bY + 4);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
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

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (maxWidth <= 0) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}
