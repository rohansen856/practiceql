"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Marketing'), (3, 'Sales');

CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, dept_id INTEGER, salary REAL);
INSERT INTO employees VALUES (1, 'Alice',   1,  95000);
INSERT INTO employees VALUES (2, 'Bob',     1, 120000);
INSERT INTO employees VALUES (3, 'Carol',   2,  72000);
INSERT INTO employees VALUES (4, 'Dave',    2,  68000);
INSERT INTO employees VALUES (5, 'Eva',     3,  85000);
INSERT INTO employees VALUES (6, 'Frank',   3,  77000);
INSERT INTO employees VALUES (7, 'Gina',    1, 110000);
`;

export default function Subqueries() {
  return (
    <article className="prose-custom">
      <h1>Subqueries and Derived Tables</h1>

      <p>
        A <strong>subquery</strong> is just a query wrapped in parentheses and used as part of
        another query. They come in three flavours:
      </p>

      <ul>
        <li><strong>Scalar</strong> - returns a single value (one row, one column).</li>
        <li><strong>Row/column</strong> - returns a list, used with <code>IN</code>.</li>
        <li><strong>Derived table</strong> - returns a table, used in <code>FROM</code> / <code>JOIN</code>.</li>
      </ul>

      <h2>Scalar subqueries</h2>
      <p>
        Return one value and plug into expressions. Classic use: compare each row to an aggregate of
        the whole table.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, salary\nFROM employees\nWHERE salary > (SELECT AVG(salary) FROM employees);`}
        title="Employees earning above the company average"
      />

      <h2>Using IN with a subquery</h2>
      <p>
        Great for “only show rows whose related value matches one of these”.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, dept_id\nFROM employees\nWHERE dept_id IN (\n  SELECT id FROM departments WHERE name <> 'Sales'\n);`}
        title="Employees not in Sales"
      />

      <h2>Derived tables (subquery in FROM)</h2>
      <p>
        You can put an entire query in <code>FROM</code> and treat it like a table. Every derived
        table needs an alias.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT dept_avg.name, dept_avg.avg_salary\nFROM (\n  SELECT d.name, AVG(e.salary) AS avg_salary\n  FROM departments d\n  JOIN employees e ON e.dept_id = d.id\n  GROUP BY d.name\n) AS dept_avg\nWHERE dept_avg.avg_salary > 80000\nORDER BY dept_avg.avg_salary DESC;`}
        title="Departments whose average salary beats $80k"
      />

      <h2>Scalar subqueries in SELECT</h2>
      <p>
        Put a subquery in the SELECT list to compute a value per row.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  e.name,\n  e.salary,\n  (SELECT AVG(salary) FROM employees) AS company_avg,\n  e.salary - (SELECT AVG(salary) FROM employees) AS vs_average\nFROM employees e\nORDER BY vs_average DESC;`}
        title="Each employee vs the company average"
      />

      <h2>Subquery vs JOIN</h2>
      <p>
        Many subqueries can be rewritten as joins and vice-versa. Modern engines are smart about
        this, but for readability: use <strong>joins</strong> when you need columns from the other
        table, and <strong>subqueries</strong> when you only need a filter or a single value.
      </p>

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Scalar subqueries return one value and can appear anywhere an expression can.</li>
          <li><code className="text-xs bg-muted px-1 rounded">IN (subquery)</code> is perfect for filtering on a list of ids.</li>
          <li>Derived tables (subquery in <code className="text-xs bg-muted px-1 rounded">FROM</code>) need an alias.</li>
          <li>Prefer CTEs (next chapter) for readability when a subquery gets complex.</li>
        </ul>
      </Card>
    </article>
  );
}
