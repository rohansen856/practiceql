"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Eye, Layers, RefreshCw, ShieldCheck } from "lucide-react";

const SEED = `
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  dept TEXT,
  salary REAL,
  hire_date TEXT
);
INSERT INTO employees VALUES (1, 'Alice',  'Engineering', 95000, '2020-03-15');
INSERT INTO employees VALUES (2, 'Bob',    'Engineering', 88000, '2021-06-01');
INSERT INTO employees VALUES (3, 'Carol',  'Marketing',   72000, '2019-11-20');
INSERT INTO employees VALUES (4, 'David',  'Sales',       68000, '2022-01-10');
INSERT INTO employees VALUES (5, 'Eva',    'Engineering', 105000,'2018-07-22');
INSERT INTO employees VALUES (6, 'Frank',  'Marketing',   65000, '2023-02-14');
INSERT INTO employees VALUES (7, 'Grace',  'Sales',       78000, '2020-09-05');
INSERT INTO employees VALUES (8, 'Henry',  'HR',          62000, '2021-12-01');
`;

export default function Views() {
  return (
    <article className="prose-custom">
      <h1>Views - Saved Queries as Tables</h1>

      <p>
        A <strong>view</strong> is a named, stored <code>SELECT</code>. It
        doesn&apos;t hold data itself - every time you query a view, the engine
        re-runs the underlying <code>SELECT</code>. Views are one of the most
        underused tools in SQL for keeping complex schemas readable.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Eye, label: "CREATE VIEW", note: "Named query" },
          { icon: Layers, label: "Encapsulate", note: "Hide complexity" },
          { icon: ShieldCheck, label: "Security", note: "Limit columns" },
          { icon: RefreshCw, label: "Materialized", note: "Cached variant" },
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

      <h2>Creating a view</h2>
      <p>
        <code>CREATE VIEW &lt;name&gt; AS &lt;select&gt;</code>. Query it like a
        table.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE VIEW engineering_team AS
SELECT id, name, salary
FROM employees
WHERE dept = 'Engineering';

SELECT * FROM engineering_team ORDER BY salary DESC;`}
        title="A simple view"
      />

      <h2>Why views matter</h2>
      <ol>
        <li>
          <strong>Readability</strong> - give a meaningful name to a complex
          query. Instead of re-writing a 40-line <code>SELECT</code>, you do{" "}
          <code>SELECT * FROM active_customers_last_30_days</code>.
        </li>
        <li>
          <strong>Security</strong> - grant users access to a view that hides
          sensitive columns, without granting access to the base table.
        </li>
        <li>
          <strong>Abstraction</strong> - change the underlying schema while
          keeping the view interface stable.
        </li>
        <li>
          <strong>Consistency</strong> - one canonical definition of
          &ldquo;active customer&rdquo; that all reports share.
        </li>
      </ol>

      <h2>Views on aggregations</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE VIEW dept_stats AS
SELECT
  dept,
  COUNT(*)            AS headcount,
  ROUND(AVG(salary))  AS avg_salary,
  MAX(salary)         AS top_salary
FROM employees
GROUP BY dept;

SELECT * FROM dept_stats ORDER BY avg_salary DESC;`}
        title="Aggregation view"
      />

      <h2>Combining views in queries</h2>
      <p>
        Views compose. You can join them, filter them, or even build views on
        top of views.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE VIEW dept_stats AS
SELECT dept, COUNT(*) AS headcount, ROUND(AVG(salary)) AS avg_salary
FROM employees
GROUP BY dept;

CREATE VIEW big_depts AS
SELECT * FROM dept_stats WHERE headcount >= 2;

SELECT * FROM big_depts ORDER BY avg_salary DESC;`}
        title="View on a view"
      />

      <h2>Updating a view</h2>
      <p>
        SQLite views are <strong>read-only</strong> by default (you can create
        an <code>INSTEAD OF</code> trigger to make them writable). To change a
        view&apos;s definition:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE VIEW engineering_team AS
SELECT id, name FROM employees WHERE dept = 'Engineering';

-- Replace it:
DROP VIEW engineering_team;
CREATE VIEW engineering_team AS
SELECT id, name, salary, hire_date FROM employees WHERE dept = 'Engineering';

SELECT * FROM engineering_team ORDER BY name;`}
        title="Replacing a view"
      />

      <h2>Temporary views</h2>
      <p>
        <code>CREATE TEMP VIEW</code> creates a view that disappears when the
        connection closes. Handy for ad-hoc analysis.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`CREATE TEMP VIEW senior AS
SELECT name, salary FROM employees WHERE salary > 80000;

SELECT * FROM senior ORDER BY salary DESC;`}
        title="Temp view"
      />

      <h2>Materialized views (not in SQLite)</h2>
      <p>
        Regular views re-run the query every time. <strong>Materialized
        views</strong> store the result and refresh it on demand. SQLite
        doesn&apos;t support them natively, but PostgreSQL does with{" "}
        <code>CREATE MATERIALIZED VIEW</code> and <code>REFRESH MATERIALIZED
        VIEW</code>. A common SQLite workaround is a real table populated by a
        scheduled <code>INSERT ... SELECT</code>.
      </p>

      <h2>When <em>not</em> to use a view</h2>
      <ul>
        <li>
          <strong>Extremely expensive queries you run constantly.</strong>{" "}
          Every access re-runs the query. Consider a cached table instead.
        </li>
        <li>
          <strong>Nested too deep.</strong> Views-on-views-on-views eventually
          become hard to optimize and debug.
        </li>
        <li>
          <strong>Row-level security</strong> in production - use proper DB
          security features (Postgres RLS) rather than ad-hoc views.
        </li>
      </ul>
    </article>
  );
}
