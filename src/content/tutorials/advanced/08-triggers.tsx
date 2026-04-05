"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Zap, Clock, History, Ban } from "lucide-react";

const SEED = `
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  updated_at TEXT
);
INSERT INTO products (name, price) VALUES ('Widget', 9.99);
INSERT INTO products (name, price) VALUES ('Gadget', 24.50);
INSERT INTO products (name, price) VALUES ('Gizmo',  49.00);

CREATE TABLE price_history (
  id INTEGER PRIMARY KEY,
  product_id INTEGER,
  old_price REAL,
  new_price REAL,
  changed_at TEXT
);
`;

export default function Triggers() {
  return (
    <article className="prose-custom">
      <h1>Triggers - Reacting to Changes</h1>

      <p>
        A <strong>trigger</strong> is a piece of SQL that runs automatically
        when an <code>INSERT</code>, <code>UPDATE</code>, or <code>DELETE</code>{" "}
        happens on a specific table. Use them sparingly - they&apos;re hidden
        behavior that can surprise future-you - but they&apos;re unbeatable for
        audit logs, denormalized counters, and enforcing complex rules.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Zap, label: "AFTER", note: "Post-change hook" },
          { icon: Clock, label: "BEFORE", note: "Pre-change hook" },
          { icon: History, label: "Audit", note: "Change history" },
          { icon: Ban, label: "RAISE", note: "Reject changes" },
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

      <h2>Anatomy of a trigger</h2>
      <pre className="font-mono text-[11px]">
{`CREATE TRIGGER <name>
[BEFORE | AFTER | INSTEAD OF] [INSERT | UPDATE | DELETE]
ON <table>
FOR EACH ROW
[WHEN <condition>]
BEGIN
  -- statements using NEW.<col> and OLD.<col>
END;`}
      </pre>

      <ul>
        <li>
          <code>NEW</code> - the new row (available in <code>INSERT</code> and{" "}
          <code>UPDATE</code>).
        </li>
        <li>
          <code>OLD</code> - the previous row (available in <code>UPDATE</code>{" "}
          and <code>DELETE</code>).
        </li>
      </ul>

      <h2>Automatic updated_at</h2>
      <p>
        A classic: every time a row is updated, set <code>updated_at</code> to{" "}
        <code>now()</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TRIGGER products_touch
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

UPDATE products SET price = 12.99 WHERE name = 'Widget';
SELECT id, name, price, updated_at FROM products;`}
        title="updated_at trigger"
      />

      <h2>Audit log</h2>
      <p>
        Append to <code>price_history</code> every time a product price
        changes.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TRIGGER log_price_change
AFTER UPDATE OF price ON products
FOR EACH ROW
WHEN OLD.price <> NEW.price
BEGIN
  INSERT INTO price_history (product_id, old_price, new_price, changed_at)
  VALUES (NEW.id, OLD.price, NEW.price, CURRENT_TIMESTAMP);
END;

UPDATE products SET price = 14.99 WHERE name = 'Widget';
UPDATE products SET price = 14.99 WHERE name = 'Widget';  -- no-op, WHEN filters it out
UPDATE products SET price = 22.00 WHERE name = 'Gadget';

SELECT product_id, old_price, new_price FROM price_history;`}
        title="Audit trigger"
      />

      <h2>Rejecting invalid changes with RAISE</h2>
      <p>
        <code>RAISE(ABORT, &apos;message&apos;)</code> cancels the offending
        statement.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TRIGGER no_negative_price
BEFORE UPDATE OF price ON products
FOR EACH ROW
WHEN NEW.price < 0
BEGIN
  SELECT RAISE(ABORT, 'Price cannot be negative');
END;

-- This update is rejected; previous rows remain unchanged
UPDATE OR IGNORE products SET price = -1 WHERE name = 'Gizmo';

SELECT name, price FROM products WHERE name = 'Gizmo';`}
        title="Guard trigger"
      />

      <h2>INSTEAD OF on views</h2>
      <p>
        SQLite views are read-only by default. Use <code>INSTEAD OF</code>{" "}
        triggers to make them writable, translating writes into the underlying
        base tables.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE VIEW active_products AS
SELECT id, name, price FROM products;

CREATE TRIGGER insert_into_active_products
INSTEAD OF INSERT ON active_products
FOR EACH ROW
BEGIN
  INSERT INTO products (name, price) VALUES (NEW.name, NEW.price);
END;

INSERT INTO active_products (id, name, price) VALUES (NULL, 'Sprocket', 3.50);
SELECT id, name, price FROM products ORDER BY id DESC LIMIT 3;`}
        title="Writable view"
      />

      <h2>Dropping triggers</h2>
      <p>
        <code>DROP TRIGGER &lt;name&gt;;</code>. Use{" "}
        <code>PRAGMA triggers;</code> or query{" "}
        <code>sqlite_master WHERE type=&apos;trigger&apos;</code> to list them.
      </p>

      <h2>When <em>not</em> to use a trigger</h2>
      <ul>
        <li>
          <strong>Core business logic.</strong> Hidden behavior in the DB makes
          apps mystifying to debug. Keep truly important logic in the
          application.
        </li>
        <li>
          <strong>Chained triggers.</strong> Trigger A fires trigger B fires
          trigger C - welcome to infinite-loop town.
        </li>
        <li>
          <strong>Hot paths.</strong> Every write pays the trigger cost.
        </li>
      </ul>

      <p>
        Triggers are best for <em>cross-cutting concerns</em>: audit trails,
        timestamp maintenance, and hardcore data integrity that&apos;s hard to
        express as a check.
      </p>
    </article>
  );
}
