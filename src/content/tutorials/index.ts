import type { ComponentType } from "react";
import type { TutorialLevel, TutorialMeta } from "@/types/tutorial";

export interface TutorialEntry extends TutorialMeta {
  load?: () => Promise<{ default: ComponentType }>;
}

export const TUTORIALS: TutorialEntry[] = [
  {
    slug: "what-is-sql",
    title: "What is SQL?",
    description:
      "Learn what SQL is, what databases are, and why tables, rows, and columns matter.",
    order: 1,
    level: "beginner",
    concepts: ["database", "table", "SELECT"],
    load: () => import("./beginner/01-what-is-sql"),
  },
  {
    slug: "select-basics",
    title: "SELECT Basics",
    description:
      "Master the SELECT statement - all columns, specific columns, aliases, and expressions.",
    order: 2,
    level: "beginner",
    concepts: ["SELECT", "AS", "expressions"],
    load: () => import("./beginner/02-select-basics"),
  },
  {
    slug: "where-filtering",
    title: "Filtering with WHERE",
    description: "Filter rows with comparison operators, IN, BETWEEN, and LIKE.",
    order: 3,
    level: "beginner",
    concepts: ["WHERE", "IN", "BETWEEN", "LIKE"],
    load: () => import("./beginner/03-where-filtering"),
  },
  {
    slug: "order-limit",
    title: "ORDER BY and LIMIT",
    description: "Sort results and slice the top N rows.",
    order: 4,
    level: "beginner",
    concepts: ["ORDER BY", "LIMIT", "OFFSET"],
    load: () => import("./beginner/04-order-limit"),
  },
  {
    slug: "null-values",
    title: "Working with NULL",
    description:
      "Understand NULL semantics and use IS NULL / COALESCE correctly.",
    order: 5,
    level: "beginner",
    concepts: ["NULL", "IS NULL", "COALESCE"],
    load: () => import("./beginner/05-null-values"),
  },
  {
    slug: "aggregation-basics",
    title: "Aggregation Basics",
    description: "COUNT, SUM, AVG, MIN, MAX and the GROUP BY clause.",
    order: 6,
    level: "beginner",
    concepts: ["COUNT", "GROUP BY", "HAVING"],
    load: () => import("./beginner/06-aggregation-basics"),
  },
  {
    slug: "joins-intro",
    title: "Joins: INNER and LEFT",
    description:
      "Combine data across tables using INNER JOIN and LEFT JOIN with visual diagrams.",
    order: 1,
    level: "intermediate",
    concepts: ["JOIN", "INNER JOIN", "LEFT JOIN"],
    load: () => import("./intermediate/01-joins-intro"),
  },
  {
    slug: "joins-advanced",
    title: "RIGHT, FULL, and CROSS Joins",
    description:
      "Less common join types, emulating FULL OUTER JOIN in SQLite.",
    order: 2,
    level: "intermediate",
    concepts: ["RIGHT JOIN", "FULL JOIN", "CROSS JOIN"],
    load: () => import("./intermediate/02-joins-advanced"),
  },
  {
    slug: "subqueries",
    title: "Subqueries and Derived Tables",
    description:
      "Scalar subqueries, IN-subqueries, and building queries on top of queries.",
    order: 3,
    level: "intermediate",
    concepts: ["subquery", "derived table", "IN"],
    load: () => import("./intermediate/03-subqueries"),
  },
  {
    slug: "exists-correlated",
    title: "EXISTS and Correlated Subqueries",
    description:
      "When to reach for EXISTS / NOT EXISTS and how correlation works.",
    order: 4,
    level: "intermediate",
    concepts: ["EXISTS", "NOT EXISTS", "correlated"],
    load: () => import("./intermediate/04-exists-correlated"),
  },
  {
    slug: "case-expressions",
    title: "CASE Expressions",
    description:
      "Conditional logic inside SELECT, ORDER BY, and aggregation.",
    order: 5,
    level: "intermediate",
    concepts: ["CASE", "conditional"],
    load: () => import("./intermediate/05-case-expressions"),
  },
  {
    slug: "having-deep",
    title: "HAVING in Depth",
    description:
      "WHERE vs HAVING, filtering groups, and combining multiple aggregate filters.",
    order: 6,
    level: "intermediate",
    concepts: ["HAVING", "GROUP BY", "aggregate filter"],
    load: () => import("./intermediate/06-having-deep"),
  },
  {
    slug: "set-operations",
    title: "UNION, INTERSECT, EXCEPT",
    description:
      "Combine result sets with set operations - Venn diagrams for queries.",
    order: 7,
    level: "intermediate",
    concepts: ["UNION", "UNION ALL", "INTERSECT", "EXCEPT"],
    load: () => import("./intermediate/07-set-operations"),
  },
  {
    slug: "date-time",
    title: "Dates and Times",
    description:
      "date(), time(), datetime(), strftime(), modifiers, and julianday math.",
    order: 8,
    level: "intermediate",
    concepts: ["date", "time", "strftime", "julianday"],
    load: () => import("./intermediate/08-date-time"),
  },
  {
    slug: "ctes",
    title: "Common Table Expressions",
    description:
      "Using WITH to make complex queries readable and reusable.",
    order: 1,
    level: "advanced",
    concepts: ["CTE", "WITH"],
    load: () => import("./advanced/01-ctes"),
  },
  {
    slug: "window-functions",
    title: "Window Functions",
    description:
      "ROW_NUMBER, RANK, SUM OVER, LAG/LEAD - analyze data across rows.",
    order: 2,
    level: "advanced",
    concepts: ["ROW_NUMBER", "PARTITION BY", "LAG", "LEAD"],
    load: () => import("./advanced/02-window-functions"),
  },
  {
    slug: "recursive-ctes",
    title: "Recursive CTEs",
    description: "Walk hierarchies and graphs with WITH RECURSIVE.",
    order: 3,
    level: "advanced",
    concepts: ["recursive", "WITH RECURSIVE"],
    load: () => import("./advanced/03-recursive-ctes"),
  },
  {
    slug: "indexes-and-performance",
    title: "Indexes and Performance",
    description:
      "How indexes work, when to add them, and EXPLAIN QUERY PLAN.",
    order: 4,
    level: "advanced",
    concepts: ["INDEX", "EXPLAIN", "query plan"],
    load: () => import("./advanced/04-indexes-and-performance"),
  },
  {
    slug: "views",
    title: "Views",
    description:
      "Saved queries: encapsulate complexity, enforce access, and compose safely.",
    order: 5,
    level: "advanced",
    concepts: ["CREATE VIEW", "encapsulation", "materialized"],
    load: () => import("./advanced/05-views"),
  },
  {
    slug: "indexes-deep",
    title: "Indexes in Depth",
    description:
      "Composite, unique, partial, and expression indexes - and how to verify usage.",
    order: 6,
    level: "advanced",
    concepts: ["composite index", "partial index", "EXPLAIN"],
    load: () => import("./advanced/06-indexes-deep"),
  },
  {
    slug: "constraints-design",
    title: "Designing with Constraints",
    description:
      "NOT NULL, UNIQUE, CHECK, FOREIGN KEY, GENERATED - make invalid states unrepresentable.",
    order: 7,
    level: "advanced",
    concepts: ["CHECK", "FOREIGN KEY", "GENERATED"],
    load: () => import("./advanced/07-constraints-design"),
  },
  {
    slug: "triggers",
    title: "Triggers",
    description:
      "Auto-react to INSERT / UPDATE / DELETE - timestamps, audit logs, and guards.",
    order: 8,
    level: "advanced",
    concepts: ["CREATE TRIGGER", "AFTER", "BEFORE", "INSTEAD OF"],
    load: () => import("./advanced/08-triggers"),
  },
  {
    slug: "transactions",
    title: "Transactions and ACID",
    description: "BEGIN / COMMIT / ROLLBACK and what ACID really means.",
    order: 1,
    level: "expert",
    concepts: ["BEGIN", "COMMIT", "ROLLBACK", "ACID"],
    load: () => import("./expert/01-transactions"),
  },
  {
    slug: "normalization",
    title: "Normalization",
    description: "1NF through 3NF, designing schemas that don't bite you later.",
    order: 2,
    level: "expert",
    concepts: ["1NF", "2NF", "3NF", "schema design"],
    load: () => import("./expert/02-normalization"),
  },
  {
    slug: "dialect-differences",
    title: "Dialects: SQLite vs Postgres vs MySQL",
    description:
      "Where SQL dialects diverge and how to write portable queries.",
    order: 3,
    level: "expert",
    concepts: ["SQLite", "PostgreSQL", "MySQL", "portability"],
    load: () => import("./expert/03-dialect-differences"),
  },
];

export const LEVEL_ORDER: TutorialLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const LEVEL_LABELS: Record<TutorialLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const LEVEL_DESCRIPTIONS: Record<TutorialLevel, string> = {
  beginner:
    "Start here if you have never written a SELECT. Learn tables, rows, filters, and simple aggregation.",
  intermediate:
    "Combine tables, filter with subqueries, and write conditional logic with CASE.",
  advanced:
    "CTEs, window functions, recursion, indexes, and reading query plans.",
  expert:
    "Transactions, normalization, and writing SQL that works across engines.",
};

export const LEVEL_ACCENT: Record<TutorialLevel, string> = {
  beginner:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  intermediate:
    "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
  advanced:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  expert:
    "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
};

export function getTutorialBySlug(slug: string): TutorialEntry | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}

export function getTutorialsByLevel(level: TutorialLevel): TutorialEntry[] {
  return TUTORIALS.filter((t) => t.level === level).sort(
    (a, b) => a.order - b.order
  );
}

export function getOrderedTutorials(): TutorialEntry[] {
  return LEVEL_ORDER.flatMap((lvl) => getTutorialsByLevel(lvl));
}

export function getAdjacentTutorials(slug: string): {
  prev: TutorialEntry | null;
  next: TutorialEntry | null;
} {
  const ordered = getOrderedTutorials();
  const idx = ordered.findIndex((t) => t.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx < ordered.length - 1 ? ordered[idx + 1] : null,
  };
}

export function isTutorialReady(entry: TutorialEntry): boolean {
  return typeof entry.load === "function";
}
