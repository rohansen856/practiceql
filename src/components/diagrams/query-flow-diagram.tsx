"use client";

import { ArrowDown } from "lucide-react";

interface QueryFlowDiagramProps {
  highlightSteps?: number[];
  className?: string;
}

const STEPS = [
  { label: "FROM / JOIN", description: "Choose tables and combine them" },
  { label: "WHERE", description: "Filter individual rows" },
  { label: "GROUP BY", description: "Group rows together" },
  { label: "HAVING", description: "Filter groups" },
  { label: "SELECT", description: "Choose columns and compute expressions" },
  { label: "DISTINCT", description: "Remove duplicate rows" },
  { label: "ORDER BY", description: "Sort the results" },
  { label: "LIMIT / OFFSET", description: "Return a subset of rows" },
];

export function QueryFlowDiagram({ highlightSteps = [], className = "" }: QueryFlowDiagramProps) {
  return (
    <div className={`flex flex-col items-center gap-0 ${className}`}>
      <p className="text-xs font-medium text-muted-foreground mb-3">SQL Query Execution Order</p>
      {STEPS.map((step, i) => {
        const isHighlighted = highlightSteps.includes(i);
        return (
          <div key={i} className="flex flex-col items-center">
            {i > 0 && (
              <ArrowDown className="h-4 w-4 text-muted-foreground/50 my-0.5" />
            )}
            <div
              className={`flex items-center gap-3 rounded-lg px-4 py-2 border transition-colors ${
                isHighlighted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">
                {i + 1}
              </span>
              <div>
                <span className="text-sm font-mono font-medium">{step.label}</span>
                <p className="text-[10px] text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
