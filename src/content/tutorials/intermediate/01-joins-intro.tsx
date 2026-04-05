"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { JoinDiagram } from "@/components/diagrams/join-diagram";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
INSERT INTO customers VALUES (1, 'Alice', 'NYC');
INSERT INTO customers VALUES (2, 'Bob',   'LA');
INSERT INTO customers VALUES (3, 'Carol', 'Chicago');
INSERT INTO customers VALUES (4, 'Dave',  'Seattle');

CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, product TEXT, amount REAL);
INSERT INTO orders VALUES (101, 1, 'Laptop',      1200);
INSERT INTO orders VALUES (102, 1, 'Headphones',   180);
INSERT INTO orders VALUES (103, 2, 'Monitor',      340);
INSERT INTO orders VALUES (104, 3, 'Keyboard',      70);
`;

export default function JoinsIntro() {
  return (
    <article className="prose-custom">
      <h1>Joins: INNER and LEFT</h1>

      <p>
        Real-world data is split across tables. <strong>Joins</strong> combine them on a shared key -
        usually an <code>id</code> and a <code>foreign_key</code>. You stitch rows together based on
        the <code>ON</code> condition.
      </p>

      <div className="not-prose grid sm:grid-cols-2 gap-4 my-6">
        <JoinDiagram type="inner" leftLabel="customers" rightLabel="orders" />
        <JoinDiagram type="left" leftLabel="customers" rightLabel="orders" />
      </div>

      <h2>INNER JOIN</h2>
      <p>
        Returns rows only when the <code>ON</code> condition matches on both sides. Unmatched rows are
        dropped.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT c.name, o.product, o.amount\nFROM customers AS c\nINNER JOIN orders AS o\n  ON o.customer_id = c.id;`}
        title="Customers that actually ordered"
        description="Dave has no orders, so he's excluded."
      />

      <h2>LEFT JOIN</h2>
      <p>
        Returns every row from the <em>left</em> table. If the right side has no match, its columns
        come back as <code>NULL</code>. Use this when you still want to see rows that have no
        relation yet - like customers with zero orders.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT c.name, o.product, o.amount\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.id\nORDER BY c.name;`}
        title="All customers, including ones with no orders"
      />

      <h2>Why table aliases help</h2>
      <p>
        Aliases (<code>c</code>, <code>o</code>) make queries concise and disambiguate columns when
        both tables have a column with the same name (like <code>id</code>).
      </p>

      <h2>Finding the mismatched side</h2>
      <p>
        A classic trick: <strong>LEFT JOIN + IS NULL</strong> finds rows on the left with nothing on
        the right.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT c.name\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.id\nWHERE o.id IS NULL;`}
        title="Customers with zero orders"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">INNER JOIN</code> = matches only.</li>
          <li><code className="text-xs bg-muted px-1 rounded">LEFT JOIN</code> = all of the left side, NULL for the right when missing.</li>
          <li>Always define the <code className="text-xs bg-muted px-1 rounded">ON</code> condition - omitting it creates a Cartesian product.</li>
          <li>Aliases keep queries readable and resolve column name clashes.</li>
        </ul>
      </Card>
    </article>
  );
}
