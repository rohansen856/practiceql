"use client";

type JoinType = "inner" | "left" | "right" | "full" | "cross";

interface JoinDiagramProps {
  type: JoinType;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

const DESCRIPTIONS: Record<JoinType, string> = {
  inner: "Returns only rows that have matching values in both tables",
  left: "Returns all rows from the left table, and matched rows from the right",
  right: "Returns all rows from the right table, and matched rows from the left",
  full: "Returns all rows when there is a match in either table",
  cross: "Returns the Cartesian product - every row paired with every other row",
};

export function JoinDiagram({
  type,
  leftLabel = "Table A",
  rightLabel = "Table B",
  className = "",
}: JoinDiagramProps) {
  const w = 280;
  const h = 180;
  const r = 60;
  const cx1 = 105;
  const cx2 = 175;
  const cy = 90;

  const getFills = () => {
    switch (type) {
      case "inner":
        return { left: "transparent", right: "transparent", intersection: "var(--color-primary)" };
      case "left":
        return { left: "var(--color-primary)", right: "transparent", intersection: "var(--color-primary)" };
      case "right":
        return { left: "transparent", right: "var(--color-primary)", intersection: "var(--color-primary)" };
      case "full":
        return { left: "var(--color-primary)", right: "var(--color-primary)", intersection: "var(--color-primary)" };
      case "cross":
        return { left: "var(--color-primary)", right: "var(--color-primary)", intersection: "var(--color-primary)" };
    }
  };

  const fills = getFills();

  if (type === "cross") {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mx-auto">
          <rect x="50" y="30" width="60" height="120" rx="8" fill="var(--color-primary)" opacity={0.2} stroke="var(--color-primary)" strokeWidth="2" />
          <rect x="170" y="30" width="60" height="120" rx="8" fill="var(--color-primary)" opacity={0.2} stroke="var(--color-primary)" strokeWidth="2" />
          {[0, 1, 2].map((i) =>
            [0, 1, 2].map((j) => (
              <line
                key={`${i}-${j}`}
                x1={80}
                y1={55 + i * 30}
                x2={200}
                y2={55 + j * 30}
                stroke="var(--color-primary)"
                strokeWidth="1"
                opacity={0.3}
              />
            ))
          )}
          <text x="80" y="20" textAnchor="middle" className="fill-foreground text-xs font-medium">{leftLabel}</text>
          <text x="200" y="20" textAnchor="middle" className="fill-foreground text-xs font-medium">{rightLabel}</text>
        </svg>
        <p className="text-xs text-muted-foreground text-center max-w-xs">{DESCRIPTIONS[type]}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mx-auto">
        <defs>
          <clipPath id={`clip-left-${type}`}>
            <circle cx={cx1} cy={cy} r={r} />
          </clipPath>
          <clipPath id={`clip-right-${type}`}>
            <circle cx={cx2} cy={cy} r={r} />
          </clipPath>
          <clipPath id={`clip-intersect-${type}`}>
            <circle cx={cx1} cy={cy} r={r} />
          </clipPath>
        </defs>

        {/* Left circle fill */}
        <circle cx={cx1} cy={cy} r={r} fill={fills.left} opacity={0.2} />
        {/* Right circle fill */}
        <circle cx={cx2} cy={cy} r={r} fill={fills.right} opacity={0.2} />
        {/* Intersection highlight */}
        <circle cx={cx2} cy={cy} r={r} clipPath={`url(#clip-intersect-${type})`} fill={fills.intersection} opacity={0.35} />

        {/* Outlines */}
        <circle cx={cx1} cy={cy} r={r} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
        <circle cx={cx2} cy={cy} r={r} fill="none" stroke="var(--color-primary)" strokeWidth="2" />

        {/* Labels */}
        <text x={cx1 - 25} y={cy + 4} textAnchor="middle" className="fill-foreground text-xs font-medium">{leftLabel}</text>
        <text x={cx2 + 25} y={cy + 4} textAnchor="middle" className="fill-foreground text-xs font-medium">{rightLabel}</text>

        {/* Type label */}
        <text x={w / 2} y={h - 5} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          {type.toUpperCase()} JOIN
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center max-w-xs">{DESCRIPTIONS[type]}</p>
    </div>
  );
}
