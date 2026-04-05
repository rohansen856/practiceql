import { TutorialLevel } from "@/types/tutorial";

export interface TutorialEntry {
  slug: string;
  title: string;
  description: string;
  level: TutorialLevel;
  order: number;
  concepts: string[];
  estimatedMinutes: number;
}

export const tutorials: TutorialEntry[] = [
  // Beginner
  {
    slug: "what-is-sql",
    title: "What is SQL?",
    description: "Introduction to databases, tables, and SQL - the language that powers data.",
    level: "beginner",
    order: 1,
    concepts: ["databases", "tables", "rows", "columns", "SQL"],
    estimatedMinutes: 5,
  },
  {
    slug: "select-basics",
    title: "SELECT Basics",
    description: "Retrieve data from tables using SELECT, choose specific columns, and use aliases.",
    level: "beginner",
    order: 2,
    concepts: ["SELECT", "FROM", "aliases", "AS", "*"],
    estimatedMinutes: 8,
  },
  {
    slug: "where-clause",
    title: "Filtering with WHERE",
    description: "Filter rows using conditions, comparison operators, AND, OR, LIKE, and IN.",
    level: "beginner",
    order: 3,
    concepts: ["WHERE", "AND", "OR", "LIKE", "IN", "BETWEEN", "IS NULL"],
    estimatedMinutes: 10,
  },
  {
    slug: "ordering-and-limiting",
    title: "Sorting & Limiting Results",
    description: "Order results with ORDER BY and limit output with LIMIT and OFFSET.",
    level: "beginner",
    order: 4,
    concepts: ["ORDER BY", "ASC", "DESC", "LIMIT", "OFFSET"],
    estimatedMinutes: 6,
  },
  {
    slug: "insert-update-delete",
    title: "Modifying Data",
    description: "Insert new rows, update existing data, and delete records safely.",
    level: "beginner",
    order: 5,
    concepts: ["INSERT INTO", "UPDATE", "DELETE", "VALUES"],
    estimatedMinutes: 8,
  },
  {
    slug: "creating-tables",
    title: "Creating Tables",
    description: "Design your own tables with data types, primary keys, and constraints.",
    level: "beginner",
    order: 6,
    concepts: ["CREATE TABLE", "data types", "PRIMARY KEY", "NOT NULL", "UNIQUE", "DEFAULT"],
    estimatedMinutes: 10,
  },
  // Intermediate
  {
    slug: "joins-explained",
    title: "JOINs Explained",
    description: "Combine rows from multiple tables with INNER, LEFT, RIGHT, and FULL JOINs.",
    level: "intermediate",
    order: 1,
    concepts: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "self-join"],
    estimatedMinutes: 15,
  },
  {
    slug: "aggregation-grouping",
    title: "Aggregation & Grouping",
    description: "Summarize data with COUNT, SUM, AVG, MIN, MAX and GROUP BY with HAVING.",
    level: "intermediate",
    order: 2,
    concepts: ["COUNT", "SUM", "AVG", "MIN", "MAX", "GROUP BY", "HAVING"],
    estimatedMinutes: 12,
  },
  {
    slug: "subqueries",
    title: "Subqueries",
    description: "Nest queries inside other queries for powerful data retrieval patterns.",
    level: "intermediate",
    order: 3,
    concepts: ["subquery", "correlated subquery", "EXISTS", "IN", "scalar subquery"],
    estimatedMinutes: 12,
  },
  {
    slug: "views-and-indexes",
    title: "Views & Indexes",
    description: "Create virtual tables and speed up queries with indexes.",
    level: "intermediate",
    order: 4,
    concepts: ["CREATE VIEW", "CREATE INDEX", "query optimization"],
    estimatedMinutes: 8,
  },
  {
    slug: "data-types-constraints",
    title: "Data Types & Constraints",
    description: "Deep dive into SQL data types, CHECK constraints, and foreign keys.",
    level: "intermediate",
    order: 5,
    concepts: ["INTEGER", "TEXT", "REAL", "BLOB", "FOREIGN KEY", "CHECK", "CASCADE"],
    estimatedMinutes: 10,
  },
  // Advanced
  {
    slug: "window-functions",
    title: "Window Functions",
    description: "Perform calculations across row sets with ROW_NUMBER, RANK, LAG, LEAD, and more.",
    level: "advanced",
    order: 1,
    concepts: ["OVER", "PARTITION BY", "ROW_NUMBER", "RANK", "DENSE_RANK", "LAG", "LEAD"],
    estimatedMinutes: 15,
  },
  {
    slug: "ctes-recursive",
    title: "CTEs & Recursive Queries",
    description: "Write cleaner queries with Common Table Expressions and handle hierarchical data.",
    level: "advanced",
    order: 2,
    concepts: ["WITH", "CTE", "recursive CTE", "hierarchical data"],
    estimatedMinutes: 12,
  },
  {
    slug: "query-optimization",
    title: "Query Optimization",
    description: "Understand EXPLAIN, indexes, and strategies to make your queries faster.",
    level: "advanced",
    order: 3,
    concepts: ["EXPLAIN", "query plan", "index usage", "performance"],
    estimatedMinutes: 10,
  },
  {
    slug: "transactions-acid",
    title: "Transactions & ACID",
    description: "Learn about atomic operations, isolation levels, and data integrity.",
    level: "advanced",
    order: 4,
    concepts: ["BEGIN", "COMMIT", "ROLLBACK", "ACID", "isolation"],
    estimatedMinutes: 8,
  },
  // Expert
  {
    slug: "advanced-joins",
    title: "Advanced JOIN Patterns",
    description: "Master anti-joins, semi-joins, lateral joins, and complex multi-table patterns.",
    level: "expert",
    order: 1,
    concepts: ["anti-join", "semi-join", "self-join patterns", "multi-way joins"],
    estimatedMinutes: 12,
  },
  {
    slug: "pivoting-unpivoting",
    title: "Pivoting & Unpivoting",
    description: "Transform rows to columns and vice versa using CASE expressions and UNION.",
    level: "expert",
    order: 2,
    concepts: ["pivot", "unpivot", "CASE", "UNION", "dynamic SQL"],
    estimatedMinutes: 10,
  },
  {
    slug: "real-world-patterns",
    title: "Real-World SQL Patterns",
    description: "Common industry patterns: running totals, gap analysis, deduplication, and more.",
    level: "expert",
    order: 3,
    concepts: ["running totals", "gaps and islands", "deduplication", "SCD"],
    estimatedMinutes: 15,
  },
];

export function getTutorialsByLevel(level: TutorialLevel): TutorialEntry[] {
  return tutorials
    .filter((t) => t.level === level)
    .sort((a, b) => a.order - b.order);
}

export function getTutorialBySlug(slug: string): TutorialEntry | undefined {
  return tutorials.find((t) => t.slug === slug);
}

export function getAdjacentTutorials(slug: string): { prev?: TutorialEntry; next?: TutorialEntry } {
  const sorted = tutorials.sort((a, b) => {
    const levelOrder = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
    const ld = levelOrder[a.level] - levelOrder[b.level];
    return ld !== 0 ? ld : a.order - b.order;
  });
  const idx = sorted.findIndex((t) => t.slug === slug);
  return {
    prev: idx > 0 ? sorted[idx - 1] : undefined,
    next: idx < sorted.length - 1 ? sorted[idx + 1] : undefined,
  };
}

export const LEVEL_ORDER: TutorialLevel[] = ["beginner", "intermediate", "advanced", "expert"];

export const LEVEL_LABELS: Record<TutorialLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const LEVEL_COLORS: Record<TutorialLevel, string> = {
  beginner: "text-green-600 dark:text-green-400",
  intermediate: "text-blue-600 dark:text-blue-400",
  advanced: "text-orange-600 dark:text-orange-400",
  expert: "text-red-600 dark:text-red-400",
};
