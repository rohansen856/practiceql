"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, city TEXT, created_at TEXT);
INSERT INTO users VALUES (1, 'alice@a.com', 'NYC',     '2024-01-01');
INSERT INTO users VALUES (2, 'bob@b.com',   'LA',      '2024-01-02');
INSERT INTO users VALUES (3, 'carol@c.com', 'NYC',     '2024-02-05');
INSERT INTO users VALUES (4, 'dave@d.com',  'Chicago', '2024-02-11');
INSERT INTO users VALUES (5, 'eve@e.com',   'LA',      '2024-03-09');
INSERT INTO users VALUES (6, 'frank@f.com', 'NYC',     '2024-03-14');
`;

export default function IndexesAndPerformance() {
  return (
    <article className="prose-custom">
      <h1>Indexes and Performance</h1>

      <p>
        An index is a secondary data structure (usually a B-tree) that lets the database find rows
        by column value <em>without</em> scanning the whole table. They are the single biggest lever
        for making SQL queries faster - but they are not free.
      </p>

      <h2>Creating an index</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_users_city ON users(city);\n-- Now a query like this can use the index:\nSELECT id, email FROM users WHERE city = 'NYC';`}
        title="CREATE INDEX"
        description="Every engine supports CREATE INDEX; SQLite auto-creates one for PRIMARY KEY."
      />

      <h2>Reading a query plan</h2>
      <p>
        <code>EXPLAIN QUERY PLAN</code> (SQLite) or <code>EXPLAIN</code> (Postgres/MySQL) shows how
        the database will actually run the query. Look for table scans (slow) vs index lookups
        (fast).
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_users_city ON users(city);\nEXPLAIN QUERY PLAN\nSELECT * FROM users WHERE city = 'NYC';`}
        title="What plan will run?"
      />

      <h2>Composite (multi-column) indexes</h2>
      <p>
        One index over several columns is used <strong>left-to-right</strong>. An index on{" "}
        <code>(city, created_at)</code> helps{" "}
        <code>WHERE city = ?</code> and <code>WHERE city = ? AND created_at = ?</code>, but not{" "}
        <code>WHERE created_at = ?</code> alone.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_users_city_created ON users(city, created_at);\nEXPLAIN QUERY PLAN\nSELECT id FROM users WHERE city = 'NYC' ORDER BY created_at DESC;`}
        title="Composite index powers WHERE + ORDER BY"
      />

      <h2>Unique indexes</h2>
      <p>
        A <code>UNIQUE</code> index enforces that no two rows share the indexed value(s). It’s both
        a data-integrity rule and a fast lookup path.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE UNIQUE INDEX idx_users_email ON users(email);\nINSERT INTO users(email, city, created_at) VALUES('alice@a.com', 'LA', '2024-03-20');\n-- Second insert with the same email will error out`}
        title="UNIQUE indexes enforce no duplicates"
      />

      <h2>When not to add an index</h2>
      <ul>
        <li>Very small tables - a scan is already fast.</li>
        <li>Columns rarely used in filters or joins.</li>
        <li>Write-heavy tables - every index makes inserts/updates slower.</li>
        <li>Low-cardinality columns (e.g. boolean) - an index usually doesn’t help.</li>
      </ul>

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Indexes convert <em>full scans</em> into <em>targeted lookups</em>.</li>
          <li>Order matters for composite indexes - they are used left-to-right.</li>
          <li>Check plans with <code className="text-xs bg-muted px-1 rounded">EXPLAIN QUERY PLAN</code> before and after adding an index.</li>
          <li>Indexes cost disk space and slow writes - add them deliberately.</li>
        </ul>
      </Card>
    </article>
  );
}
