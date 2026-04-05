"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";
import { ArrowDownAZ, ArrowUp01, Hash, SkipForward } from "lucide-react";

const SEED = `
CREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT, author TEXT, rating REAL, year INTEGER);
INSERT INTO books VALUES (1, 'The Pragmatic Programmer', 'Hunt', 4.6, 1999);
INSERT INTO books VALUES (2, 'Clean Code', 'Martin', 4.2, 2008);
INSERT INTO books VALUES (3, 'Designing Data-Intensive Apps', 'Kleppmann', 4.7, 2017);
INSERT INTO books VALUES (4, 'Code Complete', 'McConnell', 4.4, 2004);
INSERT INTO books VALUES (5, 'Refactoring', 'Fowler', 4.3, 2018);
INSERT INTO books VALUES (6, 'The Mythical Man-Month', 'Brooks', 4.1, 1975);
INSERT INTO books VALUES (7, 'Structure and Interpretation', 'Abelson', 4.8, 1984);
`;

export default function OrderLimit() {
  return (
    <article className="prose-custom">
      <h1>ORDER BY and LIMIT</h1>

      <p>
        SQL tables are <strong>unordered</strong> sets - without <code>ORDER BY</code>, the database can
        return rows in any order it wants. When order matters (top 10, most recent, highest rating),
        you have to say so.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: ArrowUp01, label: "ORDER BY col", note: "Ascending" },
          { icon: ArrowDownAZ, label: "ORDER BY col DESC", note: "Descending" },
          { icon: Hash, label: "LIMIT n", note: "Top N" },
          { icon: SkipForward, label: "OFFSET k", note: "Skip K" },
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

      <h2>Sorting rows</h2>
      <p>
        <code>ORDER BY column</code> sorts ascending by default. Add <code>DESC</code> for descending.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT title, rating\nFROM books\nORDER BY rating DESC;`}
        title="Best-rated books first"
      />

      <h2>Sorting by multiple columns</h2>
      <p>
        You can order by more than one column. Ties on the first are broken by the next.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT title, year, rating\nFROM books\nORDER BY year DESC, rating DESC;`}
        title="Newest first, then best-rated"
      />

      <h2>Top-N with LIMIT</h2>
      <p>
        <code>LIMIT n</code> caps the result set. Combined with <code>ORDER BY</code> it gives you the
        “top 3”, “top 10”, etc.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT title, rating\nFROM books\nORDER BY rating DESC\nLIMIT 3;`}
        title="The three best-rated books"
      />

      <h2>Paging with OFFSET</h2>
      <p>
        <code>OFFSET k</code> skips the first <em>k</em> rows. With <code>LIMIT</code> this gives you
        pagination.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`-- Page 2 (items 4–6) sorted by rating\nSELECT title, rating\nFROM books\nORDER BY rating DESC\nLIMIT 3 OFFSET 3;`}
        title="Second page of 3"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Without <code className="text-xs bg-muted px-1 rounded">ORDER BY</code>, row order is undefined.</li>
          <li><code className="text-xs bg-muted px-1 rounded">ORDER BY a, b DESC</code> sorts by <code>a</code>, then breaks ties by <code>b</code> descending.</li>
          <li><code className="text-xs bg-muted px-1 rounded">LIMIT</code> is evaluated <em>after</em> <code className="text-xs bg-muted px-1 rounded">ORDER BY</code>.</li>
          <li>MySQL/SQLite use <code className="text-xs bg-muted px-1 rounded">LIMIT/OFFSET</code>; Postgres also supports them. SQL Server/Oracle use <code className="text-xs bg-muted px-1 rounded">OFFSET … FETCH</code>.</li>
        </ul>
      </Card>
    </article>
  );
}
