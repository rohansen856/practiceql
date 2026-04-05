"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Filter, Layers, GitCompare, ListFilter } from "lucide-react";

const SEED = `
CREATE TABLE sales (
  id INTEGER PRIMARY KEY,
  region TEXT,
  product TEXT,
  qty INTEGER,
  price REAL,
  sale_date TEXT
);
INSERT INTO sales VALUES (1, 'North', 'Widget', 5, 9.99,  '2024-01-05');
INSERT INTO sales VALUES (2, 'North', 'Widget', 3, 9.99,  '2024-01-12');
INSERT INTO sales VALUES (3, 'North', 'Gadget', 2, 24.50, '2024-01-18');
INSERT INTO sales VALUES (4, 'South', 'Widget', 10, 9.99, '2024-02-03');
INSERT INTO sales VALUES (5, 'South', 'Widget', 4, 9.99,  '2024-02-10');
INSERT INTO sales VALUES (6, 'South', 'Gadget', 1, 24.50, '2024-02-22');
INSERT INTO sales VALUES (7, 'East',  'Gadget', 6, 24.50, '2024-03-04');
INSERT INTO sales VALUES (8, 'East',  'Widget', 1, 9.99,  '2024-03-15');
INSERT INTO sales VALUES (9, 'West',  'Widget', 2, 9.99,  '2024-03-20');
INSERT INTO sales VALUES (10,'West',  'Gizmo',  8, 49.00, '2024-03-28');
`;

export default function HavingDeep() {
  return (
    <article className="prose-custom">
      <h1>HAVING in Depth</h1>

      <p>
        <code>HAVING</code> is often introduced as &ldquo;<code>WHERE</code> but
        for groups&rdquo; and then never revisited. It&apos;s more nuanced than
        that - and getting it right is the difference between a query that runs
        in milliseconds and one that scans the whole table.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: ListFilter, label: "WHERE", note: "Filters rows" },
          { icon: Layers, label: "GROUP BY", note: "Builds groups" },
          { icon: Filter, label: "HAVING", note: "Filters groups" },
          { icon: GitCompare, label: "Combine", note: "Both, in order" },
        ].map(({ icon: Icon, label, note }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-mono text-[11px] truncate">{label}</p>
              <p className="text-muted-foreground text-[10px]">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Pipeline order matters</h2>
      <p>
        SQL doesn&apos;t execute in the order you write it. Logically, it runs:
      </p>
      <ol>
        <li>
          <code>FROM</code> &amp; <code>JOIN</code> - assemble raw rows
        </li>
        <li>
          <code>WHERE</code> - filter rows before grouping
        </li>
        <li>
          <code>GROUP BY</code> - collapse rows into groups
        </li>
        <li>
          <code>HAVING</code> - filter groups
        </li>
        <li>
          <code>SELECT</code> &amp; <code>ORDER BY</code> - project and sort
        </li>
      </ol>

      <p>
        The takeaway: <em>filter rows with <code>WHERE</code>, filter groups
        with <code>HAVING</code></em>. Don&apos;t put aggregate conditions in{" "}
        <code>WHERE</code> - it won&apos;t work.
      </p>

      <h2>Your first HAVING</h2>
      <p>
        Find regions where total quantity sold exceeds 10 units:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT region, SUM(qty) AS total_qty
FROM sales
GROUP BY region
HAVING SUM(qty) > 10
ORDER BY total_qty DESC;`}
        title="Regions selling more than 10 units"
      />

      <h2>WHERE vs HAVING - same query, different meaning</h2>
      <p>
        <code>WHERE qty &gt; 3</code> filters <strong>rows</strong> (individual
        sales) before grouping. <code>HAVING SUM(qty) &gt; 10</code> filters{" "}
        <strong>groups</strong> after grouping. Run both side by side:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`-- Only counts sales of 3+ units, then groups
SELECT region, SUM(qty) AS total_qty, COUNT(*) AS big_sales
FROM sales
WHERE qty >= 3
GROUP BY region
HAVING SUM(qty) > 5;`}
        title="WHERE + HAVING together"
      />

      <h2>Combining multiple HAVING conditions</h2>
      <p>
        <code>HAVING</code> supports <code>AND</code>, <code>OR</code>, and
        parentheses just like <code>WHERE</code>. You can filter on several
        aggregates at once.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  region,
  COUNT(*)                 AS num_sales,
  SUM(qty * price)         AS revenue,
  ROUND(AVG(price), 2)     AS avg_price
FROM sales
GROUP BY region
HAVING COUNT(*) >= 2 AND SUM(qty * price) > 50
ORDER BY revenue DESC;`}
        title="Multi-condition HAVING"
      />

      <h2>Filtering by a non-aggregated column? Use WHERE.</h2>
      <p>
        A common mistake: filtering by a plain column inside{" "}
        <code>HAVING</code>. It works in SQLite (most engines), but it&apos;s
        slower - the group has already been built. Always prefer{" "}
        <code>WHERE</code> for row-level filters.
      </p>

      <div className="not-prose grid md:grid-cols-2 gap-3 my-4 text-xs">
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-3">
          <p className="font-semibold text-rose-600 dark:text-rose-300 mb-1.5">
            Slower
          </p>
          <pre className="font-mono text-[11px]">
{`SELECT region, SUM(qty)
FROM sales
GROUP BY region
HAVING region != 'West';`}
          </pre>
        </div>
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3">
          <p className="font-semibold text-emerald-600 dark:text-emerald-300 mb-1.5">
            Faster
          </p>
          <pre className="font-mono text-[11px]">
{`SELECT region, SUM(qty)
FROM sales
WHERE region != 'West'
GROUP BY region;`}
          </pre>
        </div>
      </div>

      <h2>HAVING without GROUP BY</h2>
      <p>
        You can use <code>HAVING</code> on a query with no{" "}
        <code>GROUP BY</code> - the entire table becomes one giant group.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT SUM(qty * price) AS revenue
FROM sales
HAVING SUM(qty * price) > 200;`}
        title="Single-group HAVING"
      />

      <h2>Referencing aliases</h2>
      <p>
        In SQLite and Postgres, you can use the <em>aggregate expression</em> or
        its <em>alias</em> in <code>HAVING</code>. Using the alias is cleaner:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT
  product,
  SUM(qty * price) AS revenue
FROM sales
GROUP BY product
HAVING revenue > 100
ORDER BY revenue DESC;`}
        title="HAVING with alias"
      />

      <h2>Recap</h2>
      <ul>
        <li>
          <code>WHERE</code> is for rows, <code>HAVING</code> is for groups.
        </li>
        <li>
          Filter as early as possible with <code>WHERE</code> - it reduces the
          rows that need grouping.
        </li>
        <li>
          Combine conditions with <code>AND</code>/<code>OR</code>, and feel
          free to reference aliases.
        </li>
        <li>
          <code>HAVING</code> can be used without <code>GROUP BY</code> for
          whole-table aggregates.
        </li>
      </ul>
    </article>
  );
}
