import { Challenge } from "@/types/challenge";
import { ECOMMERCE_SEED, EMPLOYEES_SEED } from "../seed-data";

// Most of these challenges verify the index via `sqlite_master`, a catalog
// table that only exists in SQLite. The `CREATE INDEX` syntax itself is
// portable, but the verification step is not — so we tag them SQLite-only.
// A partial-index challenge is tagged SQLite+PostgreSQL since both support
// the `WHERE` clause on CREATE INDEX (MySQL does not).
export const indexesChallenges: Challenge[] = [
  {
    id: "idx-01",
    title: "Index a Single Column",
    description: "Speed up searches on `employees.email` by creating an index called `idx_employees_email`. Then run the final `SELECT` to confirm it exists in `sqlite_master`.",
    category: "indexes",
    difficulty: "beginner",
    dialects: ["sqlite"],
    seedSQL: EMPLOYEES_SEED,
    expectedColumns: ["name", "tbl_name"],
    expectedOutput: [
      ["idx_employees_email", "employees"],
    ],
    hints: [
      "Use CREATE INDEX <name> ON <table>(<column>).",
      "Then SELECT name, tbl_name FROM sqlite_master WHERE name = 'idx_employees_email'.",
      "CREATE INDEX idx_employees_email ON employees(email); SELECT name, tbl_name FROM sqlite_master WHERE name = 'idx_employees_email';",
    ],
    orderMatters: false,
    expectedQuery: "CREATE INDEX idx_employees_email ON employees(email);\nSELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name = 'idx_employees_email';",
  },
  {
    id: "idx-02",
    title: "Composite Index",
    description: "Create a composite index `idx_emp_dept_salary` on `employees(department_id, salary)` to support queries that filter by department and sort by salary. Then list it from `sqlite_master`.",
    category: "indexes",
    difficulty: "intermediate",
    dialects: ["sqlite"],
    seedSQL: EMPLOYEES_SEED,
    expectedColumns: ["name", "tbl_name"],
    expectedOutput: [
      ["idx_emp_dept_salary", "employees"],
    ],
    hints: [
      "Composite index syntax: CREATE INDEX <name> ON <table>(col1, col2).",
      "Order of columns matters for how the index can be used.",
      "CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);",
    ],
    orderMatters: false,
    expectedQuery: "CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);\nSELECT name, tbl_name FROM sqlite_master WHERE type = 'index' AND name = 'idx_emp_dept_salary';",
  },
  {
    id: "idx-03",
    title: "Unique Index",
    description: "Emails must be unique. Create a **unique index** `uniq_customer_email` on `customers(email)`, then confirm it from `sqlite_master` (the sql column should contain `UNIQUE`).",
    category: "indexes",
    difficulty: "intermediate",
    dialects: ["sqlite"],
    seedSQL: ECOMMERCE_SEED,
    expectedColumns: ["name"],
    expectedOutput: [
      ["uniq_customer_email"],
    ],
    hints: [
      "Use CREATE UNIQUE INDEX ...",
      "Unique indexes reject duplicate values at insert time.",
      "CREATE UNIQUE INDEX uniq_customer_email ON customers(email);",
    ],
    orderMatters: false,
    expectedQuery: "CREATE UNIQUE INDEX uniq_customer_email ON customers(email);\nSELECT name FROM sqlite_master WHERE type = 'index' AND name = 'uniq_customer_email';",
  },
  {
    id: "idx-04",
    title: "Partial Index",
    description: "Create a **partial index** `idx_orders_pending` on `orders(customer_id)` that only indexes rows where `status = 'pending'`. Confirm it exists. Partial indexes are supported by **SQLite** and **PostgreSQL** (MySQL does not support them).",
    category: "indexes",
    difficulty: "advanced",
    dialects: ["sqlite", "postgresql"],
    seedSQL: ECOMMERCE_SEED,
    expectedColumns: ["name"],
    expectedOutput: [
      ["idx_orders_pending"],
    ],
    hints: [
      "Add a WHERE clause to your CREATE INDEX to make it partial.",
      "Partial indexes are smaller and faster when you always filter by the same condition.",
      "CREATE INDEX idx_orders_pending ON orders(customer_id) WHERE status = 'pending';",
    ],
    orderMatters: false,
    expectedQuery: "CREATE INDEX idx_orders_pending ON orders(customer_id) WHERE status = 'pending';\nSELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_orders_pending';",
  },
  {
    id: "idx-05",
    title: "Drop an Index",
    description: "An existing index `idx_old` is slowing down writes. **Drop it** and confirm it no longer exists. (The seed already created it for you.) Return a single column `index_count` giving the number of indexes named `idx_old` remaining (should be 0).",
    category: "indexes",
    difficulty: "beginner",
    dialects: ["sqlite"],
    seedSQL: ["EMPLOYEES_SEED", "\nCREATE INDEX idx_old ON employees(last_name);\n"],
    expectedColumns: ["index_count"],
    expectedOutput: [
      [0],
    ],
    hints: [
      "DROP INDEX <name>;",
      "Verify with COUNT(*) against sqlite_master.",
      "DROP INDEX idx_old; SELECT COUNT(*) AS index_count FROM sqlite_master WHERE name = 'idx_old';",
    ],
    orderMatters: false,
    expectedQuery: "DROP INDEX idx_old;\nSELECT COUNT(*) AS index_count FROM sqlite_master WHERE type = 'index' AND name = 'idx_old';",
  },
  {
    id: "idx-06",
    title: "Count Indexes on a Table",
    description: "After creating an index on `products.category`, use `sqlite_master` to list **all indexes on the products table**. Return `name` (ordered ascending).",
    category: "indexes",
    difficulty: "intermediate",
    dialects: ["sqlite"],
    seedSQL: ECOMMERCE_SEED,
    expectedColumns: ["name"],
    expectedOutput: [
      ["idx_products_category"],
    ],
    hints: [
      "Filter sqlite_master by tbl_name = 'products' and type = 'index'.",
      "Both user-created and auto-generated indexes (from UNIQUE columns) will appear.",
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='products' ORDER BY name;",
    ],
    orderMatters: true,
    expectedQuery: "CREATE INDEX idx_products_category ON products(category);\nSELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'products' ORDER BY name;",
  },
];
