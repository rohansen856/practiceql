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
  | "advanced";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

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
}

export interface ChallengeProgress {
  challengeId: string;
  completed: boolean;
  completedAt?: number;
  lastAttemptSQL?: string;
  attempts: number;
}
