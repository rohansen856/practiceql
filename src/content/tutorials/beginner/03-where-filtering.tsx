"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";
import { Filter, Equal, Search, Braces } from "lucide-react";

const SEED = `
CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER);
INSERT INTO products VALUES (1, 'Laptop', 'Electronics', 1200.00, 14);
INSERT INTO products VALUES (2, 'Headphones', 'Electronics', 180.00, 40);
INSERT INTO products VALUES (3, 'Coffee Maker', 'Kitchen', 95.00, 8);
INSERT INTO products VALUES (4, 'Desk Chair', 'Furniture', 220.00, 0);
INSERT INTO products VALUES (5, 'Water Bottle', 'Kitchen', 18.50, 120);
INSERT INTO products VALUES (6, 'Monitor', 'Electronics', 340.00, 5);
INSERT INTO products VALUES (7, 'Lamp', 'Furniture', 45.00, 25);
INSERT INTO products VALUES (8, 'Kettle', 'Kitchen', 55.00, 3);
`;

export default function WhereFiltering() {
  return (
    <article className="prose-custom">
      <h1>Filtering with WHERE</h1>

      <p>
        So far, our queries have returned every row in a table. Most real-world queries only need a
        small slice. The <code>WHERE</code> clause lets you filter rows based on a condition - think of
        it as the SQL version of “only show me the ones that match this rule”.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Equal, label: "=  !=  <  >", note: "Compare" },
          { icon: Filter, label: "AND  OR  NOT", note: "Combine" },
          { icon: Search, label: "LIKE  IN", note: "Match" },
          { icon: Braces, label: "BETWEEN", note: "Range" },
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

      <h2>Comparison operators</h2>
      <p>
        The simplest filters compare a column to a value with <code>=</code>, <code>!=</code>,{" "}
        <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code>, or <code>&gt;=</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, price\nFROM products\nWHERE price > 100;`}
        title="Products that cost more than $100"
      />

      <h2>Combining with AND / OR</h2>
      <p>
        Combine conditions with <code>AND</code> (all must be true) and <code>OR</code> (any can be
        true). Use parentheses to be explicit about precedence.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, category, price\nFROM products\nWHERE category = 'Electronics'\n  AND price < 500;`}
        title="Affordable electronics"
        description="Both conditions must be true for a row to be returned."
      />

      <h2>Range filtering with BETWEEN</h2>
      <p>
        <code>BETWEEN a AND b</code> is a shortcut for <code>column &gt;= a AND column &lt;= b</code>.
        Both endpoints are inclusive.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, price\nFROM products\nWHERE price BETWEEN 50 AND 200;`}
        title="Mid-range prices"
      />

      <h2>Set membership with IN</h2>
      <p>
        <code>IN</code> matches a value against a list. It’s the clean way to say
        {" "}<em>“must be one of these”</em>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, category\nFROM products\nWHERE category IN ('Kitchen', 'Furniture');`}
        title="Only home categories"
      />

      <h2>Pattern matching with LIKE</h2>
      <p>
        <code>LIKE</code> matches text patterns: <code>%</code> is zero-or-more characters and{" "}
        <code>_</code> is exactly one.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name\nFROM products\nWHERE name LIKE '%er%';`}
        title='Names containing "er"'
        description="%er% matches Laptop, Headphones, Coffee Maker, Water Bottle, Kettle…"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">WHERE</code> runs before <code className="text-xs bg-muted px-1 rounded">SELECT</code> picks columns - filter first, project second.</li>
          <li>Use <code className="text-xs bg-muted px-1 rounded">AND</code> / <code className="text-xs bg-muted px-1 rounded">OR</code> with parentheses to avoid ambiguity.</li>
          <li><code className="text-xs bg-muted px-1 rounded">BETWEEN</code> is inclusive on both ends.</li>
          <li><code className="text-xs bg-muted px-1 rounded">LIKE</code> uses <code className="text-xs bg-muted px-1 rounded">%</code> and <code className="text-xs bg-muted px-1 rounded">_</code> as wildcards.</li>
        </ul>
      </Card>
    </article>
  );
}
