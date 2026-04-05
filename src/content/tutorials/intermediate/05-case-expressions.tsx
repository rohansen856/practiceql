"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, amount REAL, status TEXT);
INSERT INTO orders VALUES (1, 'Alice',    120, 'shipped');
INSERT INTO orders VALUES (2, 'Alice',     45, 'pending');
INSERT INTO orders VALUES (3, 'Bob',      890, 'shipped');
INSERT INTO orders VALUES (4, 'Bob',     1800, 'refunded');
INSERT INTO orders VALUES (5, 'Carol',    250, 'shipped');
INSERT INTO orders VALUES (6, 'Carol',     60, 'cancelled');
INSERT INTO orders VALUES (7, 'Dave',      25, 'shipped');
`;

export default function CaseExpressions() {
  return (
    <article className="prose-custom">
      <h1>CASE Expressions</h1>

      <p>
        <code>CASE</code> is SQL’s if/else. It returns a value based on conditions and can be used
        anywhere an expression is allowed - <code>SELECT</code>, <code>WHERE</code>,{" "}
        <code>ORDER BY</code>, and even inside aggregates.
      </p>

      <h2>Searched CASE</h2>
      <p>The general form: each <code>WHEN</code> has its own condition.</p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  customer,\n  amount,\n  CASE\n    WHEN amount >= 1000 THEN 'big'\n    WHEN amount >= 100  THEN 'medium'\n    ELSE                      'small'\n  END AS size\nFROM orders\nORDER BY amount DESC;`}
        title="Bucketing amounts into sizes"
      />

      <h2>Simple CASE</h2>
      <p>
        When all branches compare the same expression, you can use the compact form{" "}
        <code>CASE expr WHEN value THEN …</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  customer,\n  status,\n  CASE status\n    WHEN 'shipped'   THEN 'done'\n    WHEN 'pending'   THEN 'in-flight'\n    WHEN 'refunded'  THEN 'returned'\n    WHEN 'cancelled' THEN 'gone'\n    ELSE 'unknown'\n  END AS state\nFROM orders;`}
        title="Translating status codes"
      />

      <h2>CASE inside aggregates - conditional counts</h2>
      <p>
        A <em>super</em> common pattern: count rows that meet a condition without splitting the
        query.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  customer,\n  COUNT(*)                                                       AS orders,\n  SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END)            AS shipped,\n  SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END)       AS refund_value\nFROM orders\nGROUP BY customer\nORDER BY customer;`}
        title="Per-customer shipped / refunded summary"
      />

      <h2>CASE in ORDER BY</h2>
      <p>
        Sort results by a custom priority order.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT customer, status, amount\nFROM orders\nORDER BY\n  CASE status\n    WHEN 'pending'   THEN 1\n    WHEN 'shipped'   THEN 2\n    WHEN 'refunded'  THEN 3\n    WHEN 'cancelled' THEN 4\n  END,\n  amount DESC;`}
        title="Sort by status priority, then amount"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">CASE</code> is an <em>expression</em>, not a statement - it always returns a value.</li>
          <li>Every <code className="text-xs bg-muted px-1 rounded">CASE</code> must end with <code className="text-xs bg-muted px-1 rounded">END</code>.</li>
          <li>Use searched form when conditions differ, simple form when they compare the same expression.</li>
          <li>Combine with <code className="text-xs bg-muted px-1 rounded">SUM</code> for conditional counts without extra subqueries.</li>
        </ul>
      </Card>
    </article>
  );
}
