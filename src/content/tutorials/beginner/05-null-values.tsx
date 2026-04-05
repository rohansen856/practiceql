"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";
import { CircleSlash, Combine, ShieldAlert, Sigma } from "lucide-react";

const SEED = `
CREATE TABLE contacts (id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT, note TEXT);
INSERT INTO contacts VALUES (1, 'Alice', 'alice@mail.com', '555-0100', 'VIP');
INSERT INTO contacts VALUES (2, 'Bob',   'bob@mail.com',   NULL,        NULL);
INSERT INTO contacts VALUES (3, 'Carol', NULL,             '555-0102', 'Returning');
INSERT INTO contacts VALUES (4, 'Dave',  NULL,             NULL,        NULL);
INSERT INTO contacts VALUES (5, 'Eve',   'eve@mail.com',   '555-0104', NULL);
`;

export default function NullValues() {
  return (
    <article className="prose-custom">
      <h1>Working with NULL</h1>

      <p>
        <code>NULL</code> is SQL’s way of saying <em>“we don’t know”</em>. It isn’t the empty string,
        it isn’t zero, and it isn’t false - it’s the absence of a value. Because of that, NULLs have
        some surprising rules.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: CircleSlash, label: "NULL = NULL", note: "unknown, not true" },
          { icon: ShieldAlert, label: "IS NULL", note: "the only way to test" },
          { icon: Combine, label: "COALESCE()", note: "pick first non-NULL" },
          { icon: Sigma, label: "SUM/AVG", note: "ignore NULL" },
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

      <h2>NULL is not equal to anything</h2>
      <p>
        <code>NULL = NULL</code> evaluates to <code>NULL</code>, not <code>TRUE</code>. Use
        {" "}<code>IS NULL</code> / <code>IS NOT NULL</code> instead of <code>=</code>.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT name, phone\nFROM contacts\nWHERE phone IS NULL;`}
        title="Contacts without a phone number"
      />

      <h2>COALESCE for fallbacks</h2>
      <p>
        <code>COALESCE(a, b, c, …)</code> returns the first argument that isn’t <code>NULL</code>.
        Great for default-value behaviour in queries.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  name,\n  COALESCE(email, phone, 'no contact info') AS best_contact\nFROM contacts;`}
        title="Fallback chain with COALESCE"
      />

      <h2>NULL in arithmetic and concatenation</h2>
      <p>
        Any arithmetic with <code>NULL</code> becomes <code>NULL</code>. Use <code>COALESCE</code> or
        <code>IFNULL</code> (SQLite/MySQL) to normalize values first.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  name,\n  note,\n  note || ' (contact)' AS with_suffix,\n  COALESCE(note, 'no note') || ' (contact)' AS safe\nFROM contacts;`}
        title="NULL poisons concatenation - unless you COALESCE"
      />

      <h2>NULL and aggregation</h2>
      <p>
        Aggregates like <code>SUM</code>, <code>AVG</code>, and <code>MIN</code> <em>skip</em> NULLs,
        but <code>COUNT(*)</code> counts every row. <code>COUNT(col)</code> only counts non-NULLs.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  COUNT(*)      AS total_rows,\n  COUNT(phone)  AS rows_with_phone,\n  COUNT(email)  AS rows_with_email\nFROM contacts;`}
        title="Counting NULL vs non-NULL"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li><code className="text-xs bg-muted px-1 rounded">NULL</code> means unknown - it is neither equal to nor different from anything.</li>
          <li>Test with <code className="text-xs bg-muted px-1 rounded">IS NULL</code>, never <code className="text-xs bg-muted px-1 rounded">= NULL</code>.</li>
          <li><code className="text-xs bg-muted px-1 rounded">COALESCE</code> picks the first non-NULL value in a list.</li>
          <li><code className="text-xs bg-muted px-1 rounded">COUNT(*)</code> counts rows; <code className="text-xs bg-muted px-1 rounded">COUNT(col)</code> ignores NULLs.</li>
        </ul>
      </Card>
    </article>
  );
}
