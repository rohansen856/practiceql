"use client";

interface Table {
  name: string;
  columns: { name: string; pk?: boolean }[];
  x: number;
  y: number;
}

interface Relation {
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
}

interface ERDiagramProps {
  tables: Table[];
  relations: Relation[];
  width?: number;
  height?: number;
  className?: string;
}

export function ERDiagram({
  tables,
  relations,
  width = 600,
  height = 350,
  className = "",
}: ERDiagramProps) {
  const tableWidth = 140;
  const rowHeight = 18;
  const headerHeight = 24;

  const getTableRect = (t: Table) => ({
    x: t.x,
    y: t.y,
    w: tableWidth,
    h: headerHeight + t.columns.length * rowHeight + 4,
  });

  const getColY = (t: Table, colName: string) => {
    const idx = t.columns.findIndex((c) => c.name === colName);
    return t.y + headerHeight + idx * rowHeight + rowHeight / 2;
  };

  return (
    <div className={`overflow-auto ${className}`}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Relations */}
        {relations.map((rel, i) => {
          const fromTable = tables.find((t) => t.name === rel.from);
          const toTable = tables.find((t) => t.name === rel.to);
          if (!fromTable || !toTable) return null;

          const fromRect = getTableRect(fromTable);
          const toRect = getTableRect(toTable);
          const fromY = getColY(fromTable, rel.fromCol);
          const toY = getColY(toTable, rel.toCol);

          const fromX = fromRect.x + fromRect.w;
          const toX = toRect.x;

          const midX = (fromX + toX) / 2;

          return (
            <g key={i}>
              <path
                d={`M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="1.5"
                opacity={0.5}
              />
              {/* FK arrow */}
              <polygon
                points={`${toX},${toY} ${toX - 6},${toY - 3} ${toX - 6},${toY + 3}`}
                fill="var(--color-primary)"
                opacity={0.5}
              />
            </g>
          );
        })}

        {/* Tables */}
        {tables.map((t) => {
          const rect = getTableRect(t);
          return (
            <g key={t.name}>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                rx="6"
                fill="var(--color-card)"
                stroke="var(--color-border)"
                strokeWidth="1.5"
              />
              {/* Header */}
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={headerHeight}
                rx="6"
                fill="var(--color-primary)"
                opacity={0.1}
              />
              <rect
                x={rect.x}
                y={rect.y + headerHeight - 6}
                width={rect.w}
                height={6}
                fill="var(--color-primary)"
                opacity={0.1}
              />
              <text
                x={rect.x + rect.w / 2}
                y={rect.y + 16}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
              >
                {t.name}
              </text>
              {/* Columns */}
              {t.columns.map((col, ci) => (
                <text
                  key={col.name}
                  x={rect.x + 10}
                  y={rect.y + headerHeight + ci * rowHeight + 14}
                  className={`text-[10px] font-mono ${
                    col.pk ? "fill-amber-500 font-semibold" : "fill-muted-foreground"
                  }`}
                >
                  {col.pk ? "PK " : "   "}
                  {col.name}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
