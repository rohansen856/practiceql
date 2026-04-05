"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, region TEXT, qty INTEGER, price REAL);
INSERT INTO sales VALUES (1, 'Laptop',  'NA',  3, 1200);
INSERT INTO sales VALUES (2, 'Laptop',  'EU',  5, 1250);
INSERT INTO sales VALUES (3, 'Phone',   'NA', 10,  800);
INSERT INTO sales VALUES (4, 'Phone',   'EU',  8,  820);
INSERT INTO sales VALUES (5, 'Tablet',  'NA',  4,  500);
INSERT INTO sales VALUES (6, 'Tablet',  'EU',  2,  550);
INSERT INTO sales VALUES (7, 'Laptop',  'APAC',6, 1180);
INSERT INTO sales VALUES (8, 'Phone',   'APAC',12, 780);
`;

export default function CTEs() {
  return (
    <article className="prose-custom">
      <h1>Common Table Expressions</h1>

      <p>
        A <strong>CTE</strong> is a named temporary result set defined with <code>WITH</code> that
        you can reference later in the same query. CTEs are the SQL equivalent of giving a
        subquery a name - they make complex queries readable and let you reuse the same result
        multiple times.
      </p>

      <h2>Your first CTE</h2>
      <p>Compute revenue per row, then aggregate - using one named intermediate step.</p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`WITH revenue AS (\n  SELECT product, region, qty * price AS total\n  FROM sales\n)\nSELECT product, SUM(total) AS total_revenue\nFROM revenue\nGROUP BY product\nORDER BY total_revenue DESC;`}
        title="CTE = named subquery"
      />

      <h2>Chaining multiple CTEs</h2>
      <p>
        Comma-separate CTEs. Each one can reference earlier CTEs - this lets you build pipelines
        step by step.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`WITH\nrevenue AS (\n  SELECT product, region, qty * price AS total FROM sales\n),\nby_region AS (\n  SELECT region, SUM(total) AS region_total FROM revenue GROUP BY region\n)\nSELECT region, region_total\nFROM by_region\nORDER BY region_total DESC;`}
        title="A pipeline of CTEs"
      />

      <h2>CTE vs subquery vs view</h2>
      <ul>
        <li><strong>Subquery</strong> - inline, no name, can’t be reused in the same query.</li>
        <li><strong>CTE</strong> - named, reusable within the query, often clearer.</li>
        <li><strong>View</strong> - CTE saved to the database so any query can use it.</li>
      </ul>

      <h2>Reusing a CTE multiple times</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`WITH prod_rev AS (\n  SELECT product, SUM(qty * price) AS revenue\n  FROM sales\n  GROUP BY product\n)\nSELECT\n  p.product,\n  p.revenue,\n  ROUND(100.0 * p.revenue / (SELECT SUM(revenue) FROM prod_rev), 1) AS pct_of_total\nFROM prod_rev p\nORDER BY revenue DESC;`}
        title="Referencing a CTE twice"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">WITH name AS (…) SELECT … FROM name</code>.</li>
          <li>CTEs exist only for the duration of the enclosing query.</li>
          <li>You can chain CTEs with commas; each can reference earlier ones.</li>
          <li>Promote a CTE to a <code className="text-xs bg-muted px-1 rounded">VIEW</code> when other queries will need it too.</li>
        </ul>
      </Card>
    </article>
  );
}
