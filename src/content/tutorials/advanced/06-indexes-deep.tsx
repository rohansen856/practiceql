"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Gauge, Hash, Split, Search } from "lucide-react";

const SEED = `
CREATE TABLE people (
  id INTEGER PRIMARY KEY,
  first TEXT,
  last TEXT,
  email TEXT,
  city TEXT,
  age INTEGER
);
INSERT INTO people VALUES (1, 'Alice',  'Johnson',  'alice@x.com',  'NYC', 29);
INSERT INTO people VALUES (2, 'Bob',    'Smith',    'bob@x.com',    'LA',  34);
INSERT INTO people VALUES (3, 'Carol',  'Williams', 'carol@x.com',  'NYC', 41);
INSERT INTO people VALUES (4, 'David',  'Brown',    'david@x.com',  'SF',  27);
INSERT INTO people VALUES (5, 'Eva',    'Davis',    'eva@x.com',    'NYC', 38);
INSERT INTO people VALUES (6, 'Frank',  'Miller',   'frank@x.com',  'LA',  52);
INSERT INTO people VALUES (7, 'Grace',  'Wilson',   'grace@x.com',  'SF',  30);
INSERT INTO people VALUES (8, 'Henry',  'Moore',    'henry@x.com',  'NYC', 44);
INSERT INTO people VALUES (9, 'Iris',   'Taylor',   'iris@x.com',   'LA',  36);
INSERT INTO people VALUES (10,'Jack',   'Anderson', 'jack@x.com',   'SF',  28);
`;

export default function IndexesDeep() {
  return (
    <article className="prose-custom">
      <h1>Indexes in Depth</h1>

      <p>
        Indexes are the single biggest tool for making queries fast. But they
        aren&apos;t free - they cost disk space, slow down writes, and can be
        <em>ignored</em> by the query planner if used incorrectly. This
        tutorial shows you the knobs that matter and how to verify they&apos;re
        working.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Hash, label: "B-tree", note: "Default index type" },
          { icon: Split, label: "Composite", note: "Multi-column" },
          { icon: Search, label: "Partial", note: "Subset of rows" },
          { icon: Gauge, label: "EXPLAIN", note: "Verify usage" },
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

      <h2>What an index actually is</h2>
      <p>
        An index is a <strong>sorted copy</strong> of one or more columns, plus
        a pointer back to the original row. Looking up{" "}
        <code>email = &apos;alice@x.com&apos;</code> in an indexed column is a{" "}
        <em>binary search</em> over the index - O(log n) instead of O(n).
      </p>

      <h2>Creating your first index</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_people_email ON people(email);

-- Verify the index exists
SELECT name, sql FROM sqlite_master WHERE type='index' AND name='idx_people_email';`}
        title="Single-column index"
      />

      <h2>EXPLAIN QUERY PLAN - did it work?</h2>
      <p>
        Creating an index doesn&apos;t guarantee it&apos;s used. Prove it with{" "}
        <code>EXPLAIN QUERY PLAN</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_people_email ON people(email);

EXPLAIN QUERY PLAN
SELECT * FROM people WHERE email = 'alice@x.com';`}
        title="Confirm index usage"
      />

      <p>
        Look for <code>SEARCH … USING INDEX</code> in the plan. If you see{" "}
        <code>SCAN</code>, the engine is reading the whole table - your index
        isn&apos;t being used.
      </p>

      <h2>Composite indexes &amp; the &ldquo;leftmost&rdquo; rule</h2>
      <p>
        A composite index on <code>(city, age)</code> can be used to filter by{" "}
        <code>city</code> alone, or <code>city + age</code>, but{" "}
        <strong>not by <code>age</code> alone</strong>. The engine needs the
        leftmost columns. Think phonebook: sorted by last name, then first
        name.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_city_age ON people(city, age);

-- USES the index
EXPLAIN QUERY PLAN SELECT * FROM people WHERE city = 'NYC';

-- USES the index (city + age)
EXPLAIN QUERY PLAN SELECT * FROM people WHERE city = 'NYC' AND age > 30;

-- DOES NOT use the index (skips the leftmost column)
EXPLAIN QUERY PLAN SELECT * FROM people WHERE age > 30;`}
        title="Leftmost prefix rule"
      />

      <h2>Unique indexes</h2>
      <p>
        A unique index rejects duplicates. <code>PRIMARY KEY</code> and{" "}
        <code>UNIQUE</code> columns get a unique index automatically; you can
        also create one explicitly.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE UNIQUE INDEX uniq_email ON people(email);

-- This will fail with UNIQUE constraint violation:
-- INSERT INTO people VALUES (99, 'X', 'Y', 'alice@x.com', 'NYC', 40);

SELECT COUNT(*) AS email_count FROM people;`}
        title="Unique index"
      />

      <h2>Partial indexes</h2>
      <p>
        A <strong>partial index</strong> only indexes rows matching a{" "}
        <code>WHERE</code> clause. They&apos;re smaller, faster to maintain,
        and perfect when you almost always filter on the same condition.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_young_nyc ON people(age)
WHERE city = 'NYC';

-- The planner can use this when the query matches the partial predicate
EXPLAIN QUERY PLAN
SELECT * FROM people WHERE city = 'NYC' AND age < 40;`}
        title="Partial index"
      />

      <h2>Expression indexes</h2>
      <p>
        You can index an <em>expression</em> - useful for case-insensitive
        searches or computed columns.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_lower_email ON people(LOWER(email));

EXPLAIN QUERY PLAN
SELECT * FROM people WHERE LOWER(email) = 'alice@x.com';`}
        title="Function-based index"
      />

      <h2>When indexes <em>hurt</em></h2>
      <ul>
        <li>
          Every index slows <code>INSERT</code>, <code>UPDATE</code>, and{" "}
          <code>DELETE</code> - the engine has to update every index alongside
          the table.
        </li>
        <li>
          On small tables a full scan is faster than an index lookup.
        </li>
        <li>
          Indexes on low-cardinality columns (e.g. <code>status</code> with 3
          values) rarely pay off unless combined with other columns.
        </li>
        <li>
          <code>LIKE &apos;%foo&apos;</code> (leading wildcard) can&apos;t use
          an index - consider a reversed-column index or full-text search.
        </li>
      </ul>

      <h2>Dropping and listing indexes</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE INDEX idx_age ON people(age);

-- List all indexes on the table
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='people';

DROP INDEX idx_age;`}
        title="Index lifecycle"
      />

      <h2>Checklist before adding an index</h2>
      <ol>
        <li>Is this column in a <code>WHERE</code>, <code>JOIN</code>, or <code>ORDER BY</code>?</li>
        <li>Is the table large enough that a scan is slow?</li>
        <li>Does the query actually use it? <code>EXPLAIN QUERY PLAN</code>.</li>
        <li>Are writes going to suffer? Benchmark inserts before/after.</li>
      </ol>
    </article>
  );
}
