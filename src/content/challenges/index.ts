import { Challenge, ChallengeCategory } from "@/types/challenge";
import { ChallengeSet } from "./_types";
import { whereChallenges } from "./where";
import { joinsChallenges } from "./joins";
import { aggregationChallenges } from "./aggregation";
import { havingChallenges } from "./having";
import { subqueriesChallenges } from "./subqueries";
import { windowChallenges } from "./window-functions";
import { indexesChallenges } from "./indexes";
import { constraintsChallenges } from "./constraints";
import { complexChallenges } from "./complex-queries";
import { advancedChallenges } from "./advanced";
import { dialectSpecificChallenges } from "./dialect-specific";

export const challengeSets: ChallengeSet[] = [
  {
    category: "where",
    label: "WHERE Clause",
    description: "Filter rows with conditions, pattern matching, and NULL handling",
    challenges: whereChallenges,
  },
  {
    category: "joins",
    label: "JOINs",
    description: "Combine data from multiple tables using different join types",
    challenges: joinsChallenges,
  },
  {
    category: "aggregation",
    label: "Aggregation",
    description: "Summarize data with COUNT, SUM, AVG, GROUP BY, and HAVING",
    challenges: aggregationChallenges,
  },
  {
    category: "having",
    label: "HAVING",
    description: "Filter aggregated groups - HAVING vs WHERE, multi-condition group filters",
    challenges: havingChallenges,
  },
  {
    category: "subqueries",
    label: "Subqueries",
    description: "Scalar, correlated, EXISTS/NOT EXISTS, and derived-table patterns",
    challenges: subqueriesChallenges,
  },
  {
    category: "window-functions",
    label: "Window Functions",
    description: "ROW_NUMBER, RANK, PARTITION BY, running totals, LAG/LEAD, NTILE",
    challenges: windowChallenges,
  },
  {
    category: "indexes",
    label: "Indexes",
    description: "CREATE INDEX, UNIQUE, partial, composite, and dropping indexes",
    challenges: indexesChallenges,
  },
  {
    category: "constraints",
    label: "Constraints",
    description: "NOT NULL, UNIQUE, CHECK, DEFAULT, FOREIGN KEY with CASCADE, GENERATED",
    challenges: constraintsChallenges,
  },
  {
    category: "complex-queries",
    label: "Complex Queries",
    description: "Multi-step queries combining joins, CTEs, windows, pivots, and self-joins",
    challenges: complexChallenges,
  },
  {
    category: "advanced",
    label: "Advanced",
    description: "CTEs, recursive queries, CASE, COALESCE, UNION, and combined patterns",
    challenges: advancedChallenges,
  },
  {
    category: "dialect-specific",
    label: "Dialect-Specific",
    description: "UPSERT, RETURNING, JSON, PRAGMA, GROUP_CONCAT - patterns that vary by engine",
    challenges: dialectSpecificChallenges,
  },
];

export const allChallenges: Challenge[] = challengeSets.flatMap((s) => s.challenges);

export function getChallengeById(id: string): Challenge | undefined {
  return allChallenges.find((c) => c.id === id);
}

export function getChallengesByCategory(category: ChallengeCategory): Challenge[] {
  return allChallenges.filter((c) => c.category === category);
}

export function getAdjacentChallenges(id: string): { prev?: Challenge; next?: Challenge } {
  const idx = allChallenges.findIndex((c) => c.id === id);
  return {
    prev: idx > 0 ? allChallenges[idx - 1] : undefined,
    next: idx < allChallenges.length - 1 ? allChallenges[idx + 1] : undefined,
  };
}
