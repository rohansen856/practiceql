"use client";

import { InteractiveSQLBlock } from "@/components/tutorials/interactive-sql-block";
import { Card } from "@/components/ui/card";
import { Atom, Hourglass, Shield, HardDrive } from "lucide-react";

const SEED = `
CREATE TABLE accounts (id INTEGER PRIMARY KEY, owner TEXT, balance REAL);
INSERT INTO accounts VALUES (1, 'Alice', 500);
INSERT INTO accounts VALUES (2, 'Bob',   200);
`;

export default function Transactions() {
  return (
    <article className="prose-custom">
      <h1>Transactions and ACID</h1>

      <p>
        A <strong>transaction</strong> groups multiple SQL statements into a single, all-or-nothing
        unit. Either everything succeeds, or nothing does. This is how databases protect data
        integrity even in the face of errors, crashes, and concurrent users.
      </p>

      <div className="not-prose grid sm:grid-cols-4 gap-2 my-5 text-xs">
        {[
          { icon: Atom, label: "Atomicity", note: "All or nothing" },
          { icon: Shield, label: "Consistency", note: "Valid → valid" },
          { icon: Hourglass, label: "Isolation", note: "Transactions don't mix" },
          { icon: HardDrive, label: "Durability", note: "Committed = persistent" },
        ].map(({ icon: Icon, label, note }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
          >
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold truncate">{label}</p>
              <p className="text-muted-foreground text-[10px]">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>BEGIN / COMMIT / ROLLBACK</h2>
      <p>
        The money-transfer example: we must decrement Alice <em>and</em> increment Bob. If either
        fails we want <em>both</em> changes undone.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`BEGIN;\n  UPDATE accounts SET balance = balance - 100 WHERE owner = 'Alice';\n  UPDATE accounts SET balance = balance + 100 WHERE owner = 'Bob';\nCOMMIT;\n\nSELECT * FROM accounts;`}
        title="Successful transfer"
      />

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`BEGIN;\n  UPDATE accounts SET balance = balance - 100 WHERE owner = 'Alice';\n  -- oops, Bob's id is wrong:\n  UPDATE accounts SET balance = balance + 100 WHERE owner = 'Charlie';\nROLLBACK;\n\nSELECT * FROM accounts;`}
        title="Abort with ROLLBACK - nothing changes"
      />

      <h2>The ACID properties</h2>
      <ul>
        <li>
          <strong>Atomicity</strong> - A transaction is a single unit. Partial failures are undone.
        </li>
        <li>
          <strong>Consistency</strong> - Constraints and business rules are preserved before and
          after the transaction. Midway states never become visible to other users.
        </li>
        <li>
          <strong>Isolation</strong> - Concurrent transactions behave as if they ran one after
          another. The <em>isolation level</em> controls how strictly.
        </li>
        <li>
          <strong>Durability</strong> - Once a transaction commits, it survives crashes and power
          loss (flushed to disk / WAL).
        </li>
      </ul>

      <h2>Isolation levels (briefly)</h2>
      <ul>
        <li><strong>READ UNCOMMITTED</strong> - can see uncommitted changes (dirty reads). Rarely used.</li>
        <li><strong>READ COMMITTED</strong> - Postgres default. No dirty reads; still sees new commits mid-transaction.</li>
        <li><strong>REPEATABLE READ</strong> - MySQL InnoDB default. Same read twice gives same result.</li>
        <li><strong>SERIALIZABLE</strong> - Strictest. Transactions appear to run one at a time.</li>
      </ul>

      <h2>Savepoints</h2>
      <p>
        Large transactions can use <code>SAVEPOINT</code> to roll back to an intermediate point
        instead of discarding everything.
      </p>

      <InteractiveSQLBlock
        seedSQL={SEED}
        defaultSQL={`BEGIN;\n  UPDATE accounts SET balance = balance - 50 WHERE owner = 'Alice';\n  SAVEPOINT sp1;\n  UPDATE accounts SET balance = balance - 1000000 WHERE owner = 'Alice';\n  ROLLBACK TO SAVEPOINT sp1;\n  UPDATE accounts SET balance = balance + 50 WHERE owner = 'Bob';\nCOMMIT;\n\nSELECT * FROM accounts;`}
        title="Partial rollback with SAVEPOINT"
      />

      <h2>Key takeaways</h2>
      <Card className="p-4 bg-muted/30 not-prose">
        <ul className="space-y-1 text-sm">
          <li>Wrap related writes in <code className="text-xs bg-muted px-1 rounded">BEGIN … COMMIT</code> so partial updates never stick.</li>
          <li>ACID = Atomic / Consistent / Isolated / Durable.</li>
          <li>Isolation levels trade consistency for concurrency; know your engine’s default.</li>
          <li><code className="text-xs bg-muted px-1 rounded">SAVEPOINT</code> lets big transactions rewind to a safe point.</li>
        </ul>
      </Card>
    </article>
  );
}
