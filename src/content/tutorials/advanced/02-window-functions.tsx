"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";

const SEED = `
CREATE TABLE scores (id INTEGER PRIMARY KEY, player TEXT, game TEXT, score INTEGER, played_at TEXT);
INSERT INTO scores VALUES (1, 'Alice', 'chess', 1400, '2024-01-05');
INSERT INTO scores VALUES (2, 'Alice', 'chess', 1450, '2024-02-01');
INSERT INTO scores VALUES (3, 'Alice', 'chess', 1480, '2024-03-10');
INSERT INTO scores VALUES (4, 'Bob',   'chess', 1300, '2024-01-02');
INSERT INTO scores VALUES (5, 'Bob',   'chess', 1350, '2024-02-04');
INSERT INTO scores VALUES (6, 'Bob',   'chess', 1290, '2024-03-07');
INSERT INTO scores VALUES (7, 'Carol', 'chess', 1500, '2024-01-08');
INSERT INTO scores VALUES (8, 'Carol', 'chess', 1550, '2024-02-12');
INSERT INTO scores VALUES (9, 'Carol', 'chess', 1560, '2024-03-15');
`;

export default function WindowFunctions() {
  return (
    <article className="prose-custom">
      <h1>Window Functions</h1>

      <p>
        Window functions compute values <em>over a set of rows</em> - but unlike <code>GROUP BY</code>,
        they don’t collapse the rows. Each row keeps its identity and gets an extra value based on
        its neighbours.
      </p>

      <h2>Anatomy of a window</h2>
      <p>
        Every window function has an <code>OVER (…)</code> clause. Inside it you can optionally
        specify:
      </p>
      <ul>
        <li><code>PARTITION BY</code> - split rows into independent groups.</li>
        <li><code>ORDER BY</code> - order within each partition.</li>
        <li><em>frame</em> - which rows count (defaults are usually fine at first).</li>
      </ul>

      <h2>ROW_NUMBER, RANK, DENSE_RANK</h2>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  player,\n  score,\n  played_at,\n  ROW_NUMBER() OVER (PARTITION BY player ORDER BY played_at) AS attempt_no,\n  RANK()       OVER (ORDER BY score DESC)                      AS overall_rank\nFROM scores\nORDER BY player, played_at;`}
        title="Numbering and ranking"
      />

      <h2>Running totals with SUM OVER</h2>
      <p>
        Add an <code>ORDER BY</code> inside <code>OVER</code> to get a running calculation.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  player,\n  played_at,\n  score,\n  SUM(score) OVER (PARTITION BY player ORDER BY played_at) AS running_total,\n  AVG(score) OVER (PARTITION BY player ORDER BY played_at) AS running_avg\nFROM scores\nORDER BY player, played_at;`}
        title="Running totals and averages per player"
      />

      <h2>LAG and LEAD - compare rows</h2>
      <p>
        <code>LAG(expr)</code> pulls a value from a previous row; <code>LEAD(expr)</code> from a
        next row. Great for computing deltas.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`SELECT\n  player,\n  played_at,\n  score,\n  LAG(score) OVER (PARTITION BY player ORDER BY played_at)        AS prev_score,\n  score - LAG(score) OVER (PARTITION BY player ORDER BY played_at) AS delta\nFROM scores\nORDER BY player, played_at;`}
        title="Score change from last game"
      />

      <h2>Top N per group</h2>
      <p>
        The classic <em>top-N-per-group</em> pattern: rank within the group, then filter.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`WITH ranked AS (\n  SELECT\n    player, score, played_at,\n    ROW_NUMBER() OVER (PARTITION BY player ORDER BY score DESC) AS rn\n  FROM scores\n)\nSELECT player, score, played_at\nFROM ranked\nWHERE rn = 1;`}
        title="Each player's best score"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Window functions add per-row context without collapsing rows.</li>
          <li><code className="text-xs bg-muted px-1 rounded">PARTITION BY</code> = group. <code className="text-xs bg-muted px-1 rounded">ORDER BY</code> = order within each group.</li>
          <li><code className="text-xs bg-muted px-1 rounded">ROW_NUMBER</code> never ties; <code className="text-xs bg-muted px-1 rounded">RANK</code> skips; <code className="text-xs bg-muted px-1 rounded">DENSE_RANK</code> doesn’t skip.</li>
          <li><code className="text-xs bg-muted px-1 rounded">LAG/LEAD</code>, <code className="text-xs bg-muted px-1 rounded">SUM OVER</code> unlock running totals, deltas, moving averages.</li>
        </ul>
      </Card>
    </article>
  );
}
