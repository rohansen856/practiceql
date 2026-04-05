"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO customers VALUES (1, 'Alice'), (2, 'Bob'), (3, 'Carol'), (4, 'Dave');

CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL, status TEXT);
INSERT INTO orders VALUES (101, 1, 1200, 'shipped');
INSERT INTO orders VALUES (102, 1,  180, 'shipped');
INSERT INTO orders VALUES (103, 2,  340, 'refunded');
INSERT INTO orders VALUES (104, 3,   70, 'pending');
`;

export default function ExistsCorrelated() {
  return (
    <article className="prose-custom">
      <h1>EXISTS and Correlated Subqueries</h1>

      <p>
        A <strong>correlated</strong> subquery references a column from the outer query. It runs
        logically <em>once per outer row</em> - think of it as a tiny lookup repeated for each row.
      </p>

      <h2>EXISTS - “does at least one match?”</h2>
      <p>
        <code>EXISTS (subquery)</code> is <code>TRUE</code> as soon as the subquery returns any row.
        The database can stop looking on the first match, which often makes it faster than
        {" "}<code>COUNT(*) &gt; 0</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT c.name\nFROM customers c\nWHERE EXISTS (\n  SELECT 1\n  FROM orders o\n  WHERE o.customer_id = c.id\n    AND o.status = 'shipped'\n);`}
        title="Customers who have a shipped order"
      />

      <h2>NOT EXISTS - “no match anywhere”</h2>
      <p>
        The inverse: customers with zero matching orders. This is often clearer than
        {" "}<code>LEFT JOIN … WHERE x IS NULL</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT c.name\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.id\n);`}
        title="Customers who never placed an order"
      />

      <h2>Correlated subquery in SELECT</h2>
      <p>
        Correlated subqueries can compute per-row values. Here: each customer’s total spend.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  c.name,\n  (SELECT COALESCE(SUM(o.amount), 0)\n     FROM orders o\n    WHERE o.customer_id = c.id) AS total_spent\nFROM customers c\nORDER BY total_spent DESC;`}
        title="Per-customer totals via correlated subquery"
      />

      <h2>EXISTS vs IN - pick the right one</h2>
      <ul>
        <li><strong>EXISTS</strong> - fastest when the subquery is selective or large.</li>
        <li><strong>IN</strong> - cleanest when the list is short and fixed.</li>
        <li><strong>NOT IN</strong> - careful with NULLs; if the list contains NULL the result is empty. <strong>NOT EXISTS</strong> is NULL-safe.</li>
      </ul>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`-- Dangerous: if the subquery yields any NULL, the whole NOT IN is empty.\nSELECT c.name\nFROM customers c\nWHERE c.id NOT IN (SELECT customer_id FROM orders);\n\n-- Safer:\nSELECT c.name\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1 FROM orders o WHERE o.customer_id = c.id\n);`}
        title="NOT IN vs NOT EXISTS"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">EXISTS</code> short-circuits on the first match - great for existence checks.</li>
          <li>Correlated subqueries reference outer columns and conceptually run per outer row.</li>
          <li>Prefer <code className="text-xs bg-muted px-1 rounded">NOT EXISTS</code> over <code className="text-xs bg-muted px-1 rounded">NOT IN</code> to avoid NULL pitfalls.</li>
          <li>Many correlated patterns become clearer as joins or window functions (coming up).</li>
        </ul>
      </Card>
    </article>
  );
}
