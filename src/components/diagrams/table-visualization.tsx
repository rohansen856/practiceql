"use client";

interface TableVisualizationProps {
  tableName: string;
  columns: string[];
  rows: (string | number | null)[][];
  highlightRows?: number[];
  highlightCols?: number[];
  className?: string;
}

export function TableVisualization({
  tableName,
  columns,
  rows,
  highlightRows = [],
  highlightCols = [],
  className = "",
}: TableVisualizationProps) {
  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      <div className="px-3 py-1.5 bg-primary/5 border-b">
        <span className="text-xs font-mono font-semibold">{tableName}</span>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-2 py-1 text-left font-mono font-medium ${
                    highlightCols.includes(i) ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={`border-b last:border-0 ${
                  highlightRows.includes(ri) ? "bg-primary/5" : ""
                }`}
              >
                {row.map((val, ci) => (
                  <td
                    key={ci}
                    className={`px-2 py-1 font-mono ${
                      highlightCols.includes(ci) && highlightRows.includes(ri)
                        ? "bg-primary/10 font-semibold text-primary"
                        : highlightCols.includes(ci)
                        ? "bg-primary/5"
                        : highlightRows.includes(ri)
                        ? ""
                        : ""
                    }`}
                  >
                    {val === null ? (
                      <span className="italic text-muted-foreground">NULL</span>
                    ) : (
                      String(val)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
