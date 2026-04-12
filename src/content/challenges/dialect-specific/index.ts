import { Challenge } from "@/types/challenge";
import { EMPLOYEES_SEED } from "../seed-data";

// Challenges that exercise patterns which vary between engines. The local
// runner executes SQLite, but the `dialects` field lists every engine whose
// native syntax matches what the learner is typing here. Use this set to
// explore engine-specific features like UPSERT, RETURNING, JSON, recursive
// CTEs and pragma introspection.
export const dialectSpecificChallenges: Challenge[] = [
  {
    id: "dia-01",
    title: "Introspect a Table (SQLite PRAGMA)",
    description:
      "Use SQLite's virtual table `pragma_table_info('employees')` to list every column of the `employees` table. Return `name`, `type`, `notnull`, `pk` (in that column order), ordered by the column index. `PRAGMA` is SQLite-specific - PostgreSQL uses `information_schema.columns` and MySQL uses `SHOW COLUMNS`.",
    category: "dialect-specific",
    difficulty: "beginner",
    dialects: ["sqlite"],
    seedSQL: EMPLOYEES_SEED,
    expectedColumns: ["name", "type", "notnull", "pk"],
    expectedOutput: [
      ["id", "INTEGER", 0, 1],
      ["first_name", "TEXT", 1, 0],
      ["last_name", "TEXT", 1, 0],
      ["email", "TEXT", 0, 0],
      ["department_id", "INTEGER", 0, 0],
      ["salary", "REAL", 0, 0],
      ["hire_date", "TEXT", 0, 0],
      ["manager_id", "INTEGER", 0, 0],
    ],
    hints: [
      "Query the `pragma_table_info('<table>')` virtual table.",
      "The column index is stored in `cid` - use `ORDER BY cid`.",
      "`notnull` is quoted because it is a reserved keyword; use double quotes.",
      `SELECT name, type, "notnull", pk FROM pragma_table_info('employees') ORDER BY cid;`,
    ],
    orderMatters: true,
    expectedQuery:
      "SELECT name, type, \"notnull\", pk FROM pragma_table_info('employees') ORDER BY cid;",
  },
  {
    id: "dia-02",
    title: "UPSERT with ON CONFLICT",
    description:
      "Build a `counters` table and implement an **atomic increment** using `INSERT ... ON CONFLICT(name) DO UPDATE`. This `ON CONFLICT` syntax is native to **SQLite** (3.24+) and **PostgreSQL** (9.5+). MySQL uses a different clause, `ON DUPLICATE KEY UPDATE`.\n\nCreate `counters(name TEXT PRIMARY KEY, n INTEGER NOT NULL)`. Perform four upserts: seed `visits=1`, bump `visits` by 1, bump `visits` by 5, seed `signups=3`. Finally `SELECT name, n FROM counters ORDER BY name`.",
    category: "dialect-specific",
    difficulty: "intermediate",
    dialects: ["sqlite", "postgresql"],
    seedSQL: "",
    expectedColumns: ["name", "n"],
    expectedOutput: [
      ["signups", 3],
      ["visits", 7],
    ],
    hints: [
      "UPSERT = `INSERT ... ON CONFLICT(col) DO UPDATE SET ...`.",
      "Reference the incoming row via the `excluded` alias, e.g. `SET n = counters.n + excluded.n`.",
      "If the row doesn't exist the INSERT runs; if it collides, the UPDATE runs.",
    ],
    orderMatters: true,
    expectedQuery:
      "CREATE TABLE counters (name TEXT PRIMARY KEY, n INTEGER NOT NULL);\nINSERT INTO counters(name, n) VALUES ('visits', 1)\n  ON CONFLICT(name) DO UPDATE SET n = counters.n + excluded.n;\nINSERT INTO counters(name, n) VALUES ('visits', 1)\n  ON CONFLICT(name) DO UPDATE SET n = counters.n + excluded.n;\nINSERT INTO counters(name, n) VALUES ('visits', 5)\n  ON CONFLICT(name) DO UPDATE SET n = counters.n + excluded.n;\nINSERT INTO counters(name, n) VALUES ('signups', 3)\n  ON CONFLICT(name) DO UPDATE SET n = counters.n + excluded.n;\nSELECT name, n FROM counters ORDER BY name;",
  },
  {
    id: "dia-03",
    title: "RETURNING Clause on UPDATE",
    description:
      "Give every employee with `id` in `(3, 6, 12)` a raise to exactly **$100,000**, and use the `RETURNING` clause to emit the rows that were updated in the **same statement**. Return `id`, `first_name`, `salary`. `RETURNING` is native to **PostgreSQL** and **SQLite 3.35+**. MySQL has no equivalent - you would need a separate SELECT.",
    category: "dialect-specific",
    difficulty: "intermediate",
    dialects: ["sqlite", "postgresql"],
    seedSQL: EMPLOYEES_SEED,
    expectedColumns: ["id", "first_name", "salary"],
    expectedOutput: [
      [3, "Carol", 100000],
      [6, "Frank", 100000],
      [12, "Leo", 100000],
    ],
    hints: [
      "Append `RETURNING col1, col2, ...` after the UPDATE's WHERE clause.",
      "Works on UPDATE, INSERT and DELETE in PostgreSQL and SQLite.",
      "UPDATE employees SET salary = 100000 WHERE id IN (3, 6, 12) RETURNING id, first_name, salary;",
    ],
    orderMatters: false,
    expectedQuery:
      "UPDATE employees SET salary = 100000 WHERE id IN (3, 6, 12) RETURNING id, first_name, salary;",
  },
  {
    id: "dia-04",
    title: "Query JSON Columns with json_extract",
    description:
      "Store semi-structured event data as JSON text and query fields out of it using SQLite's `json_extract` (from the JSON1 extension). Create `events(id INTEGER PRIMARY KEY, payload TEXT)` and insert three rows of JSON payloads. Return `id`, the extracted `user`, and `score` for **all events with score greater than 20**, ordered by id.\n\nPostgreSQL uses `->>` / `jsonb_path_query`, and MySQL uses `->>`; the path expression syntax differs.",
    category: "dialect-specific",
    difficulty: "intermediate",
    dialects: ["sqlite"],
    seedSQL: "",
    expectedColumns: ["id", "user", "score"],
    expectedOutput: [
      [1, "alice", 42],
      [2, "bob", 77],
    ],
    hints: [
      "`json_extract(json, '$.path')` returns the value at the path.",
      "JSON path starts with `$` and uses dot notation, e.g. `$.user`.",
      "You can use `json_extract` in both the SELECT list and the WHERE clause.",
    ],
    orderMatters: true,
    expectedQuery:
      "CREATE TABLE events (id INTEGER PRIMARY KEY, payload TEXT);\nINSERT INTO events VALUES (1, '{\"user\":\"alice\",\"score\":42,\"tags\":[\"a\",\"b\"]}');\nINSERT INTO events VALUES (2, '{\"user\":\"bob\",\"score\":77,\"tags\":[\"c\"]}');\nINSERT INTO events VALUES (3, '{\"user\":\"carol\",\"score\":15,\"tags\":[]}');\nSELECT id,\n       json_extract(payload, '$.user')  AS user,\n       json_extract(payload, '$.score') AS score\nFROM events\nWHERE json_extract(payload, '$.score') > 20\nORDER BY id;",
  },
  {
    id: "dia-05",
    title: "String Aggregation with GROUP_CONCAT",
    description:
      "For each department, build a **comma-separated list of the first names** of everyone in it. Return `department`, `people` (sorted by department name). `GROUP_CONCAT` is native to **SQLite** and **MySQL**. PostgreSQL's equivalent is `STRING_AGG(first_name, ', ')`.",
    category: "dialect-specific",
    difficulty: "intermediate",
    dialects: ["sqlite", "mysql"],
    seedSQL: EMPLOYEES_SEED,
    expectedColumns: ["department", "people"],
    expectedOutput: [
      ["Engineering", "Alice, Bob, Eva, Jack, Olivia"],
      ["Finance", "Iris, Mia"],
      ["HR", "Henry, Noah"],
      ["Marketing", "Carol, Frank, Leo"],
      ["Sales", "David, Grace, Karen"],
    ],
    hints: [
      "`GROUP_CONCAT(expr, separator)` - second arg is the delimiter (default comma).",
      "Join `departments` and `employees`, GROUP BY department.",
      "Order of names inside each group depends on the engine; in SQLite it follows row order by primary key.",
    ],
    orderMatters: true,
    expectedQuery:
      "SELECT d.name AS department, GROUP_CONCAT(e.first_name, ', ') AS people\nFROM departments d\nJOIN employees e ON e.department_id = d.id\nGROUP BY d.id\nORDER BY d.name;",
  },
  {
    id: "dia-06",
    title: "Recursive CTE - Manager Depth",
    description:
      "Using a **recursive CTE**, compute each employee's reporting depth from the top of the org (employees with `manager_id IS NULL` are depth `0`). Return `id`, `first_name`, `depth`. Recursive CTEs are supported by **SQLite 3.8+**, **PostgreSQL 8.4+**, and **MySQL 8.0+** with identical `WITH RECURSIVE` syntax.",
    category: "dialect-specific",
    difficulty: "advanced",
    dialects: ["sqlite", "mysql", "postgresql"],
    seedSQL: EMPLOYEES_SEED,
    expectedColumns: ["id", "first_name", "depth"],
    expectedOutput: [
      [1, "Alice", 0],
      [3, "Carol", 0],
      [4, "David", 0],
      [5, "Eva", 0],
      [8, "Henry", 0],
      [9, "Iris", 0],
      [2, "Bob", 1],
      [6, "Frank", 1],
      [7, "Grace", 1],
      [10, "Jack", 1],
      [11, "Karen", 1],
      [12, "Leo", 1],
      [13, "Mia", 1],
      [14, "Noah", 1],
      [15, "Olivia", 1],
    ],
    hints: [
      "Anchor: `SELECT id, first_name, manager_id, 0 FROM employees WHERE manager_id IS NULL`.",
      "Recursive step: join the CTE back to employees on `e.manager_id = c.id`, depth + 1.",
      "Use `UNION ALL` between the anchor and recursive step.",
    ],
    orderMatters: false,
    expectedQuery:
      "WITH RECURSIVE chain(id, first_name, manager_id, depth) AS (\n  SELECT id, first_name, manager_id, 0 FROM employees WHERE manager_id IS NULL\n  UNION ALL\n  SELECT e.id, e.first_name, e.manager_id, c.depth + 1\n  FROM employees e JOIN chain c ON e.manager_id = c.id\n)\nSELECT id, first_name, depth FROM chain ORDER BY depth, id;",
  },
];
