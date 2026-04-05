"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { JoinDiagram } from "@/components/diagrams/join-diagram";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER);
INSERT INTO employees VALUES (1, 'Alice', 10);
INSERT INTO employees VALUES (2, 'Bob',   20);
INSERT INTO employees VALUES (3, 'Carol', 10);
INSERT INTO employees VALUES (4, 'Dave',  NULL);

CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO departments VALUES (10, 'Engineering');
INSERT INTO departments VALUES (20, 'Marketing');
INSERT INTO departments VALUES (30, 'Operations');

CREATE TABLE colors (name TEXT);
INSERT INTO colors VALUES ('red'), ('green'), ('blue');
CREATE TABLE sizes (name TEXT);
INSERT INTO sizes VALUES ('S'), ('M'), ('L');
`;

export default function JoinsAdvanced() {
  return (
    <article className="prose-custom">
      <h1>RIGHT, FULL, and CROSS Joins</h1>

      <p>
        <code>INNER</code> and <code>LEFT</code> cover 90% of day-to-day joins, but the rest of the
        join family solves specific problems: preserving the <em>right</em> side, seeing unmatched
        rows from <em>either</em> side, or generating every combination of two sets.
      </p>

      <div className="not-prose grid sm:grid-cols-3 gap-4 my-6">
        <JoinDiagram type="right" leftLabel="employees" rightLabel="departments" />
        <JoinDiagram type="full" leftLabel="employees" rightLabel="departments" />
        <JoinDiagram type="cross" leftLabel="colors" rightLabel="sizes" />
      </div>

      <h2>RIGHT JOIN</h2>
      <p>
        Mirror of <code>LEFT JOIN</code>. Returns every row on the right, with <code>NULL</code>s for
        the left when there’s no match. Many people just reorder the tables and use <code>LEFT</code>
        instead - stylistic choice.
      </p>

      <p>
        <strong>Note:</strong> SQLite only added <code>RIGHT JOIN</code> in v3.39. Postgres and MySQL
        have supported it for a long time.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT d.name AS department, e.name AS employee\nFROM employees AS e\nRIGHT JOIN departments AS d\n  ON d.id = e.dept_id\nORDER BY d.name, e.name;`}
        title="Every department, including empty ones"
      />

      <h2>FULL OUTER JOIN</h2>
      <p>
        Returns rows from both sides. Unmatched rows have <code>NULL</code> on the missing side.
        Great for reconciliation - <em>what’s on one side but not the other?</em>
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT e.name AS employee, d.name AS department\nFROM employees AS e\nFULL OUTER JOIN departments AS d\n  ON d.id = e.dept_id\nORDER BY department, employee;`}
        title="Both sides, padded with NULLs"
        description="Dave has no department; Operations has no employees."
      />

      <h2>Emulating FULL JOIN in older SQLite / MySQL</h2>
      <p>
        Engines without <code>FULL OUTER JOIN</code> can combine a <code>LEFT JOIN</code> with a
        {" "}<code>UNION</code> of its reverse:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT e.name AS employee, d.name AS department\nFROM employees e LEFT JOIN departments d ON d.id = e.dept_id\nUNION\nSELECT e.name, d.name\nFROM employees e RIGHT JOIN departments d ON d.id = e.dept_id;`}
        title="Portable FULL JOIN emulation"
      />

      <h2>CROSS JOIN</h2>
      <p>
        A <em>Cartesian product</em> - every row of A paired with every row of B. Useful for
        generating combinations, test data, or date grids.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT c.name AS color, s.name AS size\nFROM colors c\nCROSS JOIN sizes s\nORDER BY color, size;`}
        title="All color × size combos"
      />

      <h2>Self join</h2>
      <p>
        A table joined to itself - for hierarchies (manager/employee), or comparing rows to other
        rows in the same table.
      </p>

      <InteractiveSQLBlock
        seedSQL={`CREATE TABLE staff (id INTEGER, name TEXT, manager_id INTEGER);\nINSERT INTO staff VALUES (1, 'Alice', NULL), (2, 'Bob', 1), (3, 'Carol', 1), (4, 'Dave', 2);`}
        defaultSQL={`SELECT e.name AS employee, m.name AS manager\nFROM staff AS e\nLEFT JOIN staff AS m ON m.id = e.manager_id\nORDER BY employee;`}
        title="Employees and their managers"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">RIGHT JOIN</code> is a mirror of <code className="text-xs bg-muted px-1 rounded">LEFT JOIN</code>.</li>
          <li><code className="text-xs bg-muted px-1 rounded">FULL OUTER JOIN</code> returns all rows from both sides.</li>
          <li><code className="text-xs bg-muted px-1 rounded">CROSS JOIN</code> multiplies - <strong>always</strong> add a filter unless you really want every combination.</li>
          <li>Self joins are just the same table aliased twice.</li>
        </ul>
      </Card>
    </article>
  );
}
