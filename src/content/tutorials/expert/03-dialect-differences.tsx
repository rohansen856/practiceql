"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DialectDifferences() {
  return (
    <article className="prose-custom">
      <h1>Dialects: SQLite vs Postgres vs MySQL</h1>

      <p>
        The core of SQL - <code>SELECT</code>, <code>JOIN</code>, <code>WHERE</code>,{" "}
        <code>GROUP BY</code> - works everywhere. Around the edges, engines diverge. Here are the
        differences you’ll actually run into.
      </p>

      <div className="not-prose flex flex-wrap gap-2 my-4">
        <Badge variant="secondary">SQLite (this playground)</Badge>
        <Badge variant="secondary">PostgreSQL</Badge>
        <Badge variant="secondary">MySQL / MariaDB</Badge>
      </div>

      <h2>Type systems</h2>
      <ul>
        <li>
          <strong>SQLite</strong> - dynamic types with <em>type affinity</em>. A column declared
          {" "}<code>INTEGER</code> will accept text unless you enforce it. Types are
          <code>INTEGER / REAL / TEXT / BLOB / NUMERIC</code>.
        </li>
        <li>
          <strong>Postgres</strong> - strict, large type system: <code>int / bigint / numeric / text / varchar / boolean / timestamp / date / uuid / jsonb</code>.
        </li>
        <li>
          <strong>MySQL</strong> - strict. <code>INT / BIGINT / DECIMAL / VARCHAR / TEXT / DATE / DATETIME / JSON</code>. Modes like <code>STRICT_TRANS_TABLES</code> determine how much it coerces.
        </li>
      </ul>

      <h2>Auto-incrementing primary keys</h2>

      <InteractiveSQLBlock
        seedSQL={``}
        defaultSQL={`-- SQLite\nCREATE TABLE t_sqlite (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);\n\n-- Postgres\n-- CREATE TABLE t_pg (id SERIAL PRIMARY KEY, name TEXT);\n-- or (modern): id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY\n\n-- MySQL\n-- CREATE TABLE t_my (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100));\n\nINSERT INTO t_sqlite(name) VALUES ('first'), ('second');\nSELECT * FROM t_sqlite;`}
        title="Three ways to say 'auto id'"
      />

      <h2>String concatenation</h2>
      <ul>
        <li><strong>SQLite / Postgres</strong> - <code>'a' || 'b'</code></li>
        <li><strong>MySQL</strong> - <code>CONCAT('a','b')</code> (unless <code>PIPES_AS_CONCAT</code> is enabled)</li>
      </ul>

      <h2>LIMIT / OFFSET</h2>
      <ul>
        <li><strong>SQLite / Postgres / MySQL</strong> - <code>LIMIT n OFFSET k</code></li>
        <li><strong>SQL Server</strong> - <code>OFFSET k ROWS FETCH NEXT n ROWS ONLY</code></li>
        <li><strong>Oracle</strong> (modern) - same as SQL Server, or <code>ROWNUM</code> tricks in old versions</li>
      </ul>

      <h2>Boolean</h2>
      <ul>
        <li><strong>SQLite</strong> - stores 0/1 in an INTEGER column. No separate type.</li>
        <li><strong>Postgres</strong> - real <code>boolean</code>. <code>TRUE</code> / <code>FALSE</code>.</li>
        <li><strong>MySQL</strong> - <code>BOOLEAN</code> is an alias for <code>TINYINT(1)</code>.</li>
      </ul>

      <h2>Date / time</h2>
      <ul>
        <li><strong>SQLite</strong> - stored as text/int/real, helpers like <code>date()</code>, <code>strftime()</code>.</li>
        <li><strong>Postgres</strong> - <code>timestamp</code>, <code>timestamptz</code>, interval arithmetic with <code>INTERVAL '1 day'</code>.</li>
        <li><strong>MySQL</strong> - <code>DATETIME</code>, <code>TIMESTAMP</code>, <code>DATE_ADD/DATE_SUB</code>.</li>
      </ul>

      <InteractiveSQLBlock
        seedSQL={``}
        defaultSQL={`-- Portable date-only literal works everywhere\nSELECT DATE('2024-06-01')                        AS today,\n       DATE('2024-06-01','+7 day')              AS next_week_sqlite;\n-- Postgres equivalent:   DATE '2024-06-01' + INTERVAL '7 day'\n-- MySQL equivalent:      DATE_ADD('2024-06-01', INTERVAL 7 DAY)`}
        title="Date arithmetic varies"
      />

      <h2>Identifiers and quoting</h2>
      <ul>
        <li><strong>SQLite / Postgres</strong> - <code>&quot;column&quot;</code> (double quotes) for identifiers, single quotes for strings.</li>
        <li><strong>MySQL</strong> - backticks <code>`column`</code> by default; double quotes only with <code>ANSI_QUOTES</code>.</li>
      </ul>

      <h2>Other gotchas</h2>
      <ul>
        <li><strong>Case sensitivity.</strong> Postgres folds unquoted identifiers to lowercase; MySQL default depends on OS; SQLite is case-insensitive for identifiers.</li>
        <li><strong>String comparison.</strong> MySQL is case-insensitive for <code>VARCHAR</code> by default (collation). Postgres is case-sensitive.</li>
        <li><strong>Booleans in filters.</strong> SQLite/MySQL treat <code>1</code> and <code>'1'</code> as truthy; Postgres does not.</li>
        <li><strong>Upsert.</strong> SQLite/Postgres use <code>ON CONFLICT DO UPDATE</code>; MySQL uses <code>ON DUPLICATE KEY UPDATE</code>.</li>
      </ul>

      <h2>Writing portable SQL</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Stick to the SQL standard for everyday queries - it really is mostly portable.</li>
          <li>Avoid engine-specific functions unless you have a reason - wrap them if you must.</li>
          <li>Use parameterized queries everywhere; string-formatting SQL is where dialects bite hardest.</li>
          <li>Never rely on implicit type coercion - it’s the #1 source of subtle cross-engine bugs.</li>
        </ul>
      </Card>
    </article>
  );
}
