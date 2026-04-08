import type { SqlDialect } from "@/lib/sql/dialect";

export type ChallengeCategory =
  | "where"
  | "joins"
  | "aggregation"
  | "having"
  | "subqueries"
  | "window-functions"
  | "indexes"
  | "constraints"
  | "complex-queries"
  | "advanced"
  | "dialect-specific";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

/** Ordered list of every SQL dialect the app models. Used as the default
 * compatibility set for a challenge whose `dialects` field is omitted. */
export const ALL_DIALECTS: SqlDialect[] = ["sqlite", "mysql", "postgresql"];

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: Difficulty;
  seedSQL: string;
  expectedQuery?: string;
  expectedOutput: (string | number | null)[][];
  expectedColumns: string[];
  hints: string[];
  orderMatters: boolean;
  starterCode?: string;
  /**
   * Dialects whose SQL syntax this challenge targets. If omitted the challenge
   * is assumed to be portable across all three engines. The local runner
   * always executes against SQLite regardless of this value – the field is
   * informational and used for badges/filtering.
   */
  dialects?: SqlDialect[];
}

export function getChallengeDialects(c: Challenge): SqlDialect[] {
  return c.dialects && c.dialects.length > 0 ? c.dialects : ALL_DIALECTS;
}

export interface ChallengeProgress {
  challengeId: string;
  completed: boolean;
  completedAt?: number;
  lastAttemptSQL?: string;
  attempts: number;
}
