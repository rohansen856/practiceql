"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Combine, Minus, SquaresIntersect, Copy } from "lucide-react";

const SEED = `
CREATE TABLE newsletter_signups (email TEXT);
CREATE TABLE app_users (email TEXT);

INSERT INTO newsletter_signups VALUES ('alice@x.com');
INSERT INTO newsletter_signups VALUES ('bob@x.com');
INSERT INTO newsletter_signups VALUES ('carol@x.com');
INSERT INTO newsletter_signups VALUES ('dave@x.com');
INSERT INTO newsletter_signups VALUES ('alice@x.com');  -- duplicate

INSERT INTO app_users VALUES ('bob@x.com');
INSERT INTO app_users VALUES ('carol@x.com');
INSERT INTO app_users VALUES ('eve@x.com');
INSERT INTO app_users VALUES ('frank@x.com');
`;

export default function SetOperations() {
  return (
    <article className="prose-custom">
      <h1>Set Operations - UNION, INTERSECT, EXCEPT</h1>

      <p>
        Set operations combine results from two <code>SELECT</code> queries into
        one. Think of them like Venn diagrams: union, intersection, and
        difference.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Combine, label: "UNION", note: "A ∪ B (distinct)" },
          { icon: Copy, label: "UNION ALL", note: "A ∪ B (keeps dups)" },
          { icon: SquaresIntersect, label: "INTERSECT", note: "A ∩ B" },
          { icon: Minus, label: "EXCEPT", note: "A − B" },
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

      <h2>The rules</h2>
      <ul>
        <li>Both queries must return the same number of columns.</li>
        <li>
          Columns are compared <strong>by position</strong>, not by name -
          result column names come from the first query.
        </li>
        <li>
          Types must be compatible (SQLite is lenient, others stricter).
        </li>
        <li>
          <code>ORDER BY</code> goes at the very end, after all the unions.
        </li>
      </ul>

      <h2>UNION: combining lists</h2>
      <p>
        &ldquo;Everyone who signed up for the newsletter <em>or</em> uses the
        app.&rdquo; Note: <code>UNION</code> removes duplicates.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT email FROM newsletter_signups
UNION
SELECT email FROM app_users
ORDER BY email;`}
        title="UNION - distinct emails"
      />

      <h2>UNION ALL: keep duplicates (faster!)</h2>
      <p>
        If you don&apos;t need deduplication, <code>UNION ALL</code> is much
        faster because the engine doesn&apos;t have to sort and remove dupes.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT email FROM newsletter_signups
UNION ALL
SELECT email FROM app_users
ORDER BY email;`}
        title="UNION ALL - keeps every row"
      />

      <h2>INTERSECT: the overlap</h2>
      <p>
        &ldquo;Who is on <em>both</em> lists?&rdquo; - active app users who also
        subscribed to the newsletter.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT email FROM newsletter_signups
INTERSECT
SELECT email FROM app_users
ORDER BY email;`}
        title="INTERSECT - on both lists"
      />

      <h2>EXCEPT: the difference</h2>
      <p>
        &ldquo;Newsletter subscribers who <em>haven&apos;t</em> signed up for
        the app.&rdquo; (Great for re-engagement campaigns.)
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT email FROM newsletter_signups
EXCEPT
SELECT email FROM app_users
ORDER BY email;`}
        title="EXCEPT - A minus B"
      />

      <p className="text-xs text-muted-foreground">
        Note: MySQL calls this <code>MINUS</code>. SQLite and PostgreSQL use{" "}
        <code>EXCEPT</code>.
      </p>

      <h2>Combining multiple set operations</h2>
      <p>
        You can chain any number of set operations. Use parentheses to control
        grouping when mixing operators.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`-- Anyone who signed up somewhere, but NOT someone who is only a newsletter-signup duplicate
SELECT email FROM newsletter_signups
UNION
SELECT email FROM app_users
EXCEPT
SELECT 'alice@x.com'
ORDER BY email;`}
        title="Chained set operations"
      />

      <h2>Column names come from the first SELECT</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT email AS contact FROM newsletter_signups
UNION
SELECT email FROM app_users
ORDER BY contact;`}
        title="Aliasing in set operations"
      />

      <h2>When to use a JOIN instead</h2>
      <p>
        Set operations work on <em>rows of the same shape</em>. When you want
        columns from both sides, use a <code>JOIN</code> - not a set operation.
        Rule of thumb:
      </p>

      <ul>
        <li>
          Combining <em>same-shaped</em> result sets → set operation.
        </li>
        <li>
          Adding <em>columns</em> from another table → join.
        </li>
      </ul>
    </article>
  );
}
