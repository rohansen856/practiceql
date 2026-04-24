import { ColumnInfo, ForeignKeyInfo } from "@/types/sql";

export interface ErdTable {
  name: string;
  columns: ColumnInfo[];
  fks: ForeignKeyInfo[];
  /** A quick lookup of column names that participate in an outgoing FK. */
  fkCols: Set<string>;
  /** Column names that are the *target* of an FK from some other table. */
  targetCols: Set<string>;
}

export interface ErdNode extends ErdTable {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ErdEdge {
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
}

const CARD_WIDTH = 224;
const ROW_HEIGHT = 22;
const HEADER_HEIGHT = 34;
const COL_PADDING = 10;

export function cardHeight(t: ErdTable): number {
  return HEADER_HEIGHT + t.columns.length * ROW_HEIGHT + COL_PADDING;
}

export function buildErdModel(
  tables: { name: string }[],
  schemas: Record<string, ColumnInfo[]>,
  foreignKeys: Record<string, ForeignKeyInfo[]>,
): { tables: ErdTable[]; edges: ErdEdge[] } {
  const inbound = new Set<string>();
  const edges: ErdEdge[] = [];
  for (const [from, fks] of Object.entries(foreignKeys)) {
    for (const fk of fks) {
      edges.push({
        from,
        fromCol: fk.column,
        to: fk.refTable,
        toCol: fk.refColumn,
      });
      inbound.add(`${fk.refTable}.${fk.refColumn}`);
    }
  }

  const tableModels: ErdTable[] = tables.map((t) => {
    const columns = schemas[t.name] ?? [];
    const fks = foreignKeys[t.name] ?? [];
    const fkCols = new Set(fks.map((f) => f.column));
    const targetCols = new Set(
      columns
        .map((c) => c.name)
        .filter((c) => inbound.has(`${t.name}.${c}`)),
    );
    return {
      name: t.name,
      columns,
      fks,
      fkCols,
      targetCols,
    };
  });

  return { tables: tableModels, edges };
}

/**
 * Grid layout with a twist: tables are grouped into connected components by
 * FK relationships so related tables sit near each other. Within a group we
 * order by name, and we flow groups top-to-bottom.
 */
export function layoutErd(
  tables: ErdTable[],
  edges: ErdEdge[],
  options: { columns?: number; gapX?: number; gapY?: number } = {},
): ErdNode[] {
  const columnsPerRow = options.columns ?? 3;
  const gapX = options.gapX ?? 64;
  const gapY = options.gapY ?? 48;

  const adjacency = new Map<string, Set<string>>();
  for (const t of tables) adjacency.set(t.name, new Set());
  for (const e of edges) {
    adjacency.get(e.from)?.add(e.to);
    adjacency.get(e.to)?.add(e.from);
  }

  const visited = new Set<string>();
  const groups: string[][] = [];
  for (const t of tables) {
    if (visited.has(t.name)) continue;
    const stack = [t.name];
    const group: string[] = [];
    while (stack.length) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      group.push(cur);
      for (const n of adjacency.get(cur) ?? []) stack.push(n);
    }
    group.sort();
    groups.push(group);
  }

  // Bigger components first so simple tables stack neatly afterwards.
  groups.sort((a, b) => b.length - a.length);
  const flat = groups.flat();
  const byName = new Map(tables.map((t) => [t.name, t]));

  const nodes: ErdNode[] = [];
  // Track row heights so uneven cards don't overlap.
  let rowMaxY = 0;
  let rowStartY = 0;

  flat.forEach((name, i) => {
    const t = byName.get(name);
    if (!t) return;
    const col = i % columnsPerRow;
    const row = Math.floor(i / columnsPerRow);

    if (col === 0 && i > 0) {
      rowStartY = rowMaxY + gapY;
      rowMaxY = rowStartY;
    }

    const x = col * (CARD_WIDTH + gapX);
    const y = rowStartY;
    const height = cardHeight(t);
    rowMaxY = Math.max(rowMaxY, y + height);

    nodes.push({ ...t, x, y, width: CARD_WIDTH, height });
    // If we're at column 0 of the very first row, align rowStartY.
    if (i === 0) rowStartY = 0;
    // Silence unused row variable.
    void row;
  });

  return nodes;
}

export const ERD_CONSTANTS = {
  CARD_WIDTH,
  ROW_HEIGHT,
  HEADER_HEIGHT,
  COL_PADDING,
};
