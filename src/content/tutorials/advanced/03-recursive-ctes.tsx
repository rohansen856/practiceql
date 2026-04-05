"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER);
INSERT INTO employees VALUES (1, 'CEO Alice',  NULL);
INSERT INTO employees VALUES (2, 'VP Bob',     1);
INSERT INTO employees VALUES (3, 'VP Carol',   1);
INSERT INTO employees VALUES (4, 'Dir Dave',   2);
INSERT INTO employees VALUES (5, 'Dir Eva',    2);
INSERT INTO employees VALUES (6, 'Dir Frank',  3);
INSERT INTO employees VALUES (7, 'Eng Gina',   4);
INSERT INTO employees VALUES (8, 'Eng Hank',   4);
INSERT INTO employees VALUES (9, 'Eng Ivy',    5);
`;

export default function RecursiveCTEs() {
  return (
    <article className="prose-custom">
      <h1>Recursive CTEs</h1>

      <p>
        A recursive CTE references itself. It’s the tool you reach for when walking hierarchies
        (org charts, categories, file systems) or graphs - anything with an unknown depth.
      </p>

      <h2>Anatomy</h2>
      <pre className="not-prose rounded-md border bg-muted/40 p-3 text-xs overflow-x-auto"><code>{`WITH RECURSIVE walk AS (
  -- 1) anchor: the starting row(s)
  SELECT …
  UNION ALL
  -- 2) recursive step: rows derived from previous iterations
  SELECT … FROM walk JOIN …
)
SELECT * FROM walk;`}</code></pre>

      <h2>Walking an org chart</h2>
      <p>
        Find everyone under a given manager, following the <code>manager_id</code> chain.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`WITH RECURSIVE reports AS (\n  SELECT id, name, manager_id, 0 AS depth\n  FROM employees\n  WHERE id = 1\n\n  UNION ALL\n\n  SELECT e.id, e.name, e.manager_id, r.depth + 1\n  FROM employees e\n  JOIN reports r ON e.manager_id = r.id\n)\nSELECT depth, name FROM reports ORDER BY depth, name;`}
        title="Alice's full org"
      />

      <h2>Generating a series</h2>
      <p>
        Recursive CTEs also work for number ranges and calendar generation.
      </p>

      <InteractiveSQLBlock
        seedSQL={``}
        defaultSQL={`WITH RECURSIVE n(x) AS (\n  SELECT 1\n  UNION ALL\n  SELECT x + 1 FROM n WHERE x < 10\n)\nSELECT x, x * x AS squared FROM n;`}
        title="Numbers 1–10 and their squares"
      />

      <h2>Building a path</h2>
      <p>
        Concatenate names as you walk to form a full path. Using the <code>||</code> operator in
        SQLite, <code>CONCAT</code> in MySQL, and <code>||</code> in Postgres.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`WITH RECURSIVE chain AS (\n  SELECT id, name, manager_id, name AS path\n  FROM employees WHERE manager_id IS NULL\n\n  UNION ALL\n\n  SELECT e.id, e.name, e.manager_id, c.path || ' > ' || e.name\n  FROM employees e JOIN chain c ON e.manager_id = c.id\n)\nSELECT name, path FROM chain ORDER BY path;`}
        title="Full hierarchy paths"
      />

      <h2>Safety: always have a stop condition</h2>
      <p>
        If your recursion has no terminating condition (or you have a cycle in the data) it runs
        forever. Add a <code>WHERE depth &lt; 100</code> guard when you don’t fully trust the data.
      </p>

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Recursive CTEs have an <strong>anchor</strong> query and a <strong>recursive step</strong>, joined with <code className="text-xs bg-muted px-1 rounded">UNION ALL</code>.</li>
          <li>Use them for hierarchies, graphs, and generated sequences.</li>
          <li>Always ensure the recursion converges - worst case, add a depth guard.</li>
        </ul>
      </Card>
    </article>
  );
}
