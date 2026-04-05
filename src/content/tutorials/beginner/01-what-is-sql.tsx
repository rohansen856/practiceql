"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { TableVisualization } from "@/components/diagrams/table-visualization";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, age INTEGER, grade TEXT);
INSERT INTO students VALUES (1, 'Alice', 14, 'A');
INSERT INTO students VALUES (2, 'Bob', 15, 'B');
INSERT INTO students VALUES (3, 'Carol', 14, 'A');
INSERT INTO students VALUES (4, 'Dave', 16, 'C');
`;

export default function WhatIsSQL() {
  return (
    <article className="prose-custom">
      <h1>What is SQL?</h1>

      <p>
        <strong>SQL</strong> (Structured Query Language) is the standard language for communicating with
        relational databases. Whether you&apos;re building a web app, analyzing data, or managing a business
        - SQL is how you ask questions about your data.
      </p>

      <h2>What is a Database?</h2>
      <p>
        A <strong>database</strong> is an organized collection of data. Think of it like a spreadsheet
        application - but much more powerful. A database can store millions of rows and let you
        search through them in milliseconds.
      </p>

      <h2>Tables, Rows, and Columns</h2>
      <p>
        Data in a relational database is stored in <strong>tables</strong>. Each table has:
      </p>
      <ul>
        <li><strong>Columns</strong> - define what kind of data is stored (name, age, grade)</li>
        <li><strong>Rows</strong> - each row is one record (one student, one order, etc.)</li>
      </ul>

      <TableVisualization
        tableName="students"
        columns={["id", "name", "age", "grade"]}
        rows={[
          [1, "Alice", 14, "A"],
          [2, "Bob", 15, "B"],
          [3, "Carol", 14, "A"],
          [4, "Dave", 16, "C"],
        ]}
        highlightCols={[]}
        highlightRows={[]}
      />

      <h2>Your First SQL Query</h2>
      <p>
        The most basic SQL command is <code>SELECT</code>. It retrieves data from a table.
        Try running the query below:
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL="SELECT * FROM students;"
        title="Try it: Select all students"
        description="The * means 'all columns'. Click Run or press Ctrl+Enter."
      />

      <h2>Key Takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>SQL is the language for talking to relational databases</li>
          <li>Data is organized in tables with rows and columns</li>
          <li><code className="text-xs bg-muted px-1 rounded">SELECT * FROM table_name</code> retrieves all data from a table</li>
          <li>Every SQL statement ends with a semicolon <code className="text-xs bg-muted px-1 rounded">;</code></li>
        </ul>
      </Card>
    </article>
  );
}
