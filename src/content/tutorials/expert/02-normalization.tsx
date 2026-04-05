"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

export default function Normalization() {
  return (
    <article className="prose-custom">
      <h1>Normalization</h1>

      <p>
        Normalization is the process of restructuring a schema so that data is stored <em>once</em>,
        in a <em>well-defined place</em>, with <em>clear relationships</em>. The goal is to eliminate
        redundancy and prevent update anomalies.
      </p>

      <h2>The problem: an unnormalized table</h2>

      <InteractiveSQLBlock
        seedSQL={`CREATE TABLE orders_flat (id INTEGER, customer TEXT, customer_email TEXT, items TEXT);\nINSERT INTO orders_flat VALUES\n(1, 'Alice', 'alice@a.com', 'Laptop, Mouse'),\n(2, 'Alice', 'alice@a.com', 'Keyboard'),\n(3, 'Bob',   'bob@b.com',   'Laptop, Headphones, Mouse');`}
        defaultSQL={`SELECT * FROM orders_flat;`}
        title="One big table - notice the problems"
        description="Repeated customer data, multiple items crammed into one column, hard to query."
      />

      <h2>1NF - atomic values, no repeating groups</h2>
      <p>
        Every column holds a single atomic value; every row is unique. No lists crammed into one
        column, no <code>item1 / item2 / item3</code> parallel columns.
      </p>

      <InteractiveSQLBlock
        seedSQL={``}
        defaultSQL={`CREATE TABLE order_items (\n  order_id INTEGER,\n  item     TEXT\n);\nINSERT INTO order_items VALUES (1, 'Laptop'), (1, 'Mouse'), (2, 'Keyboard'),\n                               (3, 'Laptop'), (3, 'Headphones'), (3, 'Mouse');\nSELECT * FROM order_items;`}
        title="1NF: each item on its own row"
      />

      <h2>2NF - no partial dependencies</h2>
      <p>
        Applies when the primary key is composite. Every non-key column must depend on the{" "}
        <em>whole</em> key, not just part of it. Practically: if a column only depends on one piece
        of a composite key, split it into its own table.
      </p>

      <h2>3NF - no transitive dependencies</h2>
      <p>
        Non-key columns must depend on the key - and <em>only</em> the key. If <code>zip_code</code>
        {" "}determines <code>city</code>, move that relationship to its own table.
      </p>

      <InteractiveSQLBlock
        seedSQL={``}
        defaultSQL={`CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT);\nCREATE TABLE orders    (id INTEGER PRIMARY KEY, customer_id INTEGER, placed_at TEXT);\nCREATE TABLE products  (id INTEGER PRIMARY KEY, name TEXT, price REAL);\nCREATE TABLE order_items (\n  order_id INTEGER, product_id INTEGER, qty INTEGER,\n  PRIMARY KEY(order_id, product_id)\n);\n\n-- Now customer data lives in one place. Change once, reflect everywhere.\nSELECT name FROM customers;`}
        title="3NF shape: customers, orders, products, order_items"
      />

      <h2>Keys and relationships</h2>
      <ul>
        <li><strong>Primary key</strong> - uniquely identifies a row.</li>
        <li><strong>Foreign key</strong> - enforces that a value exists in another table.</li>
        <li><strong>Candidate key</strong> - any column(s) that could be a PK.</li>
        <li><strong>Surrogate key</strong> - an artificial id (<code>INTEGER PRIMARY KEY</code>) instead of a natural one.</li>
      </ul>

      <h2>When to denormalize</h2>
      <p>
        Normalization minimizes redundancy, but joins cost something. For read-heavy analytics or
        caches, controlled <em>denormalization</em> (duplicating a value to avoid joins) is common.
        Rule of thumb: design normalized first, denormalize only with evidence.
      </p>

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><strong>1NF</strong>: atomic values, unique rows.</li>
          <li><strong>2NF</strong>: every non-key column depends on the <em>whole</em> key.</li>
          <li><strong>3NF</strong>: every non-key column depends on the key, <em>only</em> the key.</li>
          <li>Foreign keys stitch the split tables back together.</li>
          <li>Denormalize when you have measured reasons, not by default.</li>
        </ul>
      </Card>
    </article>
  );
}
