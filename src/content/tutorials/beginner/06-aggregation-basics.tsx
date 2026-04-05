"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";
import { Sigma, Calculator, Group, Filter } from "lucide-react";

const SEED = `
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, product TEXT, quantity INTEGER, amount REAL, city TEXT);
INSERT INTO orders VALUES (1, 'Alice', 'Laptop',     1, 1200, 'NYC');
INSERT INTO orders VALUES (2, 'Alice', 'Headphones', 2,  360, 'NYC');
INSERT INTO orders VALUES (3, 'Bob',   'Monitor',    2,  680, 'LA');
INSERT INTO orders VALUES (4, 'Bob',   'Laptop',     1, 1200, 'LA');
INSERT INTO orders VALUES (5, 'Carol', 'Keyboard',   3,  210, 'NYC');
INSERT INTO orders VALUES (6, 'Carol', 'Mouse',      4,  120, 'NYC');
INSERT INTO orders VALUES (7, 'Dave',  'Chair',      1,  220, 'LA');
INSERT INTO orders VALUES (8, 'Dave',  'Lamp',       2,   90, 'LA');
`;

export default function AggregationBasics() {
  return (
    <article className="prose-custom">
      <h1>Aggregation Basics</h1>

      <p>
        Aggregate functions collapse many rows into one summary value - <em>how many</em>,{" "}
        <em>how much</em>, <em>what’s the average</em>, <em>what’s the maximum</em>. Combined with
        {" "}<code>GROUP BY</code>, they let you compute summaries per category.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Sigma, label: "COUNT / SUM", note: "How many / total" },
          { icon: Calculator, label: "AVG / MIN / MAX", note: "Average, extremes" },
          { icon: Group, label: "GROUP BY", note: "One row per group" },
          { icon: Filter, label: "HAVING", note: "Filter groups" },
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

      <h2>Single-value aggregates</h2>
      <p>
        Without <code>GROUP BY</code>, an aggregate collapses <em>all</em> rows into one row.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  COUNT(*)    AS orders,\n  SUM(amount) AS revenue,\n  AVG(amount) AS avg_order,\n  MAX(amount) AS biggest_order\nFROM orders;`}
        title="Whole-dataset summary"
      />

      <h2>Grouping rows</h2>
      <p>
        <code>GROUP BY column</code> creates one row per distinct value of <code>column</code>. Every
        non-aggregated column in the <code>SELECT</code> must appear in <code>GROUP BY</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  customer,\n  COUNT(*)     AS num_orders,\n  SUM(amount)  AS total_spent\nFROM orders\nGROUP BY customer\nORDER BY total_spent DESC;`}
        title="Spend by customer"
      />

      <h2>Grouping by multiple columns</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  city,\n  customer,\n  SUM(amount) AS total\nFROM orders\nGROUP BY city, customer\nORDER BY city, total DESC;`}
        title="City + customer breakdown"
      />

      <h2>Filtering groups with HAVING</h2>
      <p>
        <code>WHERE</code> filters rows <em>before</em> grouping; <code>HAVING</code> filters{" "}
        <em>after</em> aggregation. Use <code>HAVING</code> when the filter depends on an aggregate.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  customer,\n  SUM(amount) AS total\nFROM orders\nGROUP BY customer\nHAVING SUM(amount) > 500\nORDER BY total DESC;`}
        title="Customers who spent more than $500"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Aggregates compute one value from many rows.</li>
          <li><code className="text-xs bg-muted px-1 rounded">GROUP BY</code> turns “one value overall” into “one value per group”.</li>
          <li>Execution order: <code className="text-xs bg-muted px-1 rounded">FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT</code>.</li>
          <li>Use <code className="text-xs bg-muted px-1 rounded">WHERE</code> for row filters, <code className="text-xs bg-muted px-1 rounded">HAVING</code> for aggregate filters.</li>
        </ul>
      </Card>
    </article>
  );
}
