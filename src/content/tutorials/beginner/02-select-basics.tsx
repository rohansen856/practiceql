"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE employees (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, department TEXT, salary REAL);
INSERT INTO employees VALUES (1, 'Alice', 'Johnson', 'Engineering', 95000);
INSERT INTO employees VALUES (2, 'Bob', 'Smith', 'Marketing', 72000);
INSERT INTO employees VALUES (3, 'Carol', 'Williams', 'Engineering', 88000);
INSERT INTO employees VALUES (4, 'David', 'Brown', 'Sales', 68000);
INSERT INTO employees VALUES (5, 'Eva', 'Davis', 'Engineering', 105000);
`;

export default function SelectBasics() {
  return (
    <article className="prose-custom">
      <h1>SELECT Basics</h1>

      <p>
        The <code>SELECT</code> statement is the most frequently used SQL command. It lets you
        choose exactly which data you want to retrieve from a table.
      </p>

      <h2>Selecting All Columns</h2>
      <p>
        Use <code>*</code> (asterisk) to select every column:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL="SELECT * FROM employees;"
        title="Select all columns"
      />

      <h2>Selecting Specific Columns</h2>
      <p>
        Instead of <code>*</code>, list the columns you want, separated by commas:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL="SELECT first_name, department, salary FROM employees;"
        title="Select specific columns"
        description="Only retrieves the three columns we asked for."
      />

      <h2>Column Aliases with AS</h2>
      <p>
        You can rename columns in the output using <code>AS</code>:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT first_name AS name, salary AS annual_pay\nFROM employees;`}
        title="Using aliases"
        description="The output columns will be named 'name' and 'annual_pay' instead."
      />

      <h2>Expressions in SELECT</h2>
      <p>
        You can compute values directly in SELECT:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT first_name, salary, salary / 12 AS monthly_pay\nFROM employees;`}
        title="Computed columns"
        description="Divides annual salary by 12 to get monthly pay."
      />

      <h2>Key Takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">SELECT *</code> gets all columns</li>
          <li><code className="text-xs bg-muted px-1 rounded">SELECT col1, col2</code> gets specific columns</li>
          <li><code className="text-xs bg-muted px-1 rounded">AS alias</code> renames columns in output</li>
          <li>You can use math expressions like <code className="text-xs bg-muted px-1 rounded">salary / 12</code></li>
        </ul>
      </Card>
    </article>
  );
}
