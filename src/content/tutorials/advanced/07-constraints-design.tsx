"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { ShieldCheck, KeyRound, Link2, Lock } from "lucide-react";

const SEED = `
CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
INSERT INTO authors VALUES (1, 'Ada Lovelace');
INSERT INTO authors VALUES (2, 'Grace Hopper');
`;

export default function ConstraintsDesign() {
  return (
    <article className="prose-custom">
      <h1>Designing with Constraints</h1>

      <p>
        Constraints are rules the database enforces <strong>for you</strong>.
        If an application forgets to validate input, a constraint will still
        catch it. Putting validation in the schema is one of the highest-ROI
        investments you can make.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: KeyRound, label: "PRIMARY KEY", note: "Unique row id" },
          { icon: Lock, label: "NOT NULL", note: "Required field" },
          { icon: ShieldCheck, label: "CHECK", note: "Valid value" },
          { icon: Link2, label: "FOREIGN KEY", note: "Referential integrity" },
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

      <h2>NOT NULL &amp; DEFAULT</h2>
      <p>
        <code>NOT NULL</code> says &ldquo;this column must have a value.&rdquo;{" "}
        <code>DEFAULT</code> provides one if the inserter doesn&apos;t.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (title) VALUES ('Hello');
INSERT INTO posts (title, published) VALUES ('Draft stays hidden', 0);

SELECT id, title, published, created_at FROM posts;`}
        title="NOT NULL with DEFAULT"
      />

      <h2>UNIQUE - one-of-a-kind values</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  UNIQUE (username)
);

INSERT INTO users (email, username) VALUES ('a@x.com', 'alice');
-- Duplicate email -> IGNORE so the next insert still runs
INSERT OR IGNORE INTO users (email, username) VALUES ('a@x.com', 'alice2');
INSERT INTO users (email, username) VALUES ('b@x.com', 'bob');

SELECT * FROM users ORDER BY id;`}
        title="UNIQUE"
      />

      <h2>CHECK - arbitrary validation</h2>
      <p>
        <code>CHECK (&lt;expr&gt;)</code> lets you encode any boolean rule.
        Great for ranges, enum-like strings, and cross-column invariants.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL CHECK (price > 0),
  discount REAL NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= price),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived'))
);

INSERT INTO products (name, price, status) VALUES ('A', 10, 'active');
INSERT INTO products (name, price, discount, status) VALUES ('B', 20, 3, 'active');
INSERT OR IGNORE INTO products (name, price, status) VALUES ('C', -1, 'active');    -- negative price
INSERT OR IGNORE INTO products (name, price, status) VALUES ('D', 10, 'whatever');  -- bad status

SELECT * FROM products;`}
        title="CHECK constraints"
      />

      <h2>PRIMARY KEY variants</h2>
      <ul>
        <li>
          <code>INTEGER PRIMARY KEY</code> - becomes the rowid alias (fast
          autoincrement). Most common.
        </li>
        <li>
          <code>UUID TEXT PRIMARY KEY</code> - distributed-friendly, no
          coordination needed.
        </li>
        <li>
          <strong>Composite PK</strong> - for link tables, the pair uniquely
          identifies the row.
        </li>
      </ul>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TABLE post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id)
);

INSERT INTO post_tags (post_id, tag_id) VALUES (1, 10);
INSERT INTO post_tags (post_id, tag_id) VALUES (1, 11);
INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (1, 10);  -- dup

SELECT post_id, tag_id FROM post_tags ORDER BY post_id, tag_id;`}
        title="Composite primary key"
      />

      <h2>FOREIGN KEY - referential integrity</h2>
      <p>
        A foreign key says &ldquo;this column must reference an existing row in
        another table.&rdquo; On changes to the parent, you can choose the
        behavior.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`PRAGMA foreign_keys = ON;

CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author_id INTEGER NOT NULL
    REFERENCES authors(id)
    ON DELETE CASCADE
    ON UPDATE RESTRICT
);

INSERT INTO books (title, author_id) VALUES ('Notes on the Engine', 1);
INSERT INTO books (title, author_id) VALUES ('Compilers at Sea', 2);

-- Deletes cascade to books
DELETE FROM authors WHERE id = 1;

SELECT id, title, author_id FROM books;`}
        title="ON DELETE CASCADE"
      />

      <p>
        Common <code>ON DELETE</code> options:
      </p>
      <ul>
        <li>
          <code>CASCADE</code> - delete children too.
        </li>
        <li>
          <code>SET NULL</code> - orphan the child (column must be nullable).
        </li>
        <li>
          <code>RESTRICT</code> / <code>NO ACTION</code> - reject the delete if
          children exist.
        </li>
        <li>
          <code>SET DEFAULT</code> - use the column&apos;s default value.
        </li>
      </ul>

      <p className="text-xs text-muted-foreground">
        Remember to enable <code>PRAGMA foreign_keys = ON;</code> in SQLite -
        they&apos;re off by default!
      </p>

      <h2>GENERATED columns</h2>
      <p>
        Store a derived value without keeping it consistent by hand. Use{" "}
        <code>VIRTUAL</code> (computed on read) unless you need indexing - then{" "}
        <code>STORED</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TABLE invoices (
  id INTEGER PRIMARY KEY,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total REAL GENERATED ALWAYS AS (qty * unit_price) VIRTUAL
);

INSERT INTO invoices (qty, unit_price) VALUES (3, 9.99);
INSERT INTO invoices (qty, unit_price) VALUES (10, 4.50);

SELECT * FROM invoices;`}
        title="Generated column"
      />

      <h2>A well-constrained schema</h2>
      <p>A reasonable starting template for almost any entity:</p>

      <div className="rounded-md border bg-muted/30 p-3 my-3 text-xs">
        <pre className="font-mono text-[11px]">
{`CREATE TABLE <entity> (
  id         INTEGER PRIMARY KEY,
  <required> TEXT    NOT NULL,
  <optional> TEXT,
  status     TEXT    NOT NULL DEFAULT 'active'
             CHECK (status IN ('active','archived')),
  created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  <fk>_id    INTEGER NOT NULL
             REFERENCES <other>(id) ON DELETE RESTRICT
);`}
        </pre>
      </div>

      <h2>Takeaways</h2>
      <ul>
        <li>Make invalid states <strong>unrepresentable</strong>.</li>
        <li>
          Constraints are documentation the database enforces - they&apos;re
          free reliability.
        </li>
        <li>
          Turn <code>foreign_keys</code> on in SQLite. Don&apos;t forget.
        </li>
        <li>
          When in doubt, add the constraint. It&apos;s easier to relax later
          than to clean up bad data.
        </li>
      </ul>
    </article>
  );
}
