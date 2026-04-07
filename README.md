# PracticeQL

A Next.js SQL learning playground. Write, run, and learn SQL with guided
tutorials, challenges, visual diagrams, and a schema builder — then, when
you're ready, point it at real MySQL or PostgreSQL databases.

Everything about the learning experience runs in your browser. Adding credentials
for a real database opens up an optional server-proxied execution path.

## Features

- **Playground** — CodeMirror editor, resizable panels, schema + query history
  sidebar, results panel with error/diff view.
- **Schema Builder** — visual table creation with column types, constraints,
  foreign keys (with auto-type-inference), `CHECK`, `COLLATE`, generated
  columns, `AUTOINCREMENT`, `WITHOUT ROWID`, and a live SQL preview.
- **Tutorials** — structured lessons from beginner to advanced, each with
  interactive SQL blocks and visual diagrams (`JoinDiagram`, `ERDiagram`,
  `QueryFlowDiagram`, `TableVisualization`).
- **SQL Keyword Reference** — searchable catalogue of 100+ SQL keywords with
  examples, dialect notes, and cross-links.
- **Challenges** — categorized practice (WHERE, JOINs, aggregation, HAVING,
  subqueries, window functions, indexes, constraints, complex queries, etc.),
  with expected-vs-actual comparison and progressive hints.
- **Multi-engine support** — SQLite (default, browser-local) plus optional
  **real MySQL and PostgreSQL** connections via encrypted credential vault.

## Engines

### SQLite (default)

Ships as WebAssembly (`sql.js`). Your databases, progress, and query history
are persisted in IndexedDB. No network, no account, works offline after the
first load. This is the engine used by all tutorials and challenges.

### MySQL / PostgreSQL (optional, credential-based)

You can add credentials for a real MySQL or PostgreSQL database. Queries run
through Next.js API routes using the `pg` and `mysql2` drivers — the browser
never speaks SQL directly to the database.

- **Storage** — Connection profiles live in IndexedDB. Passwords are encrypted
  client-side with **AES-GCM** (key derived via PBKDF2, 210k iterations) from
  a vault passphrase you set. The plaintext password only exists in memory for
  the duration of a request.
- **Vault lifecycle** — The vault stays unlocked for the current browser tab
  session. "Lock vault" clears the in-memory key; reloading the tab also
  re-locks.
- **Engine switcher** — The header shows the active engine. Switch between
  SQLite and any saved remote connection; if you haven't unlocked the vault,
  the switcher directs you to Settings.

### Roadmap targets

PGlite (browser-only PostgreSQL), MySQL dialect-shim over SQLite, and NoSQL
stubs (MongoDB/Cassandra) are tracked in [ROADMAP.md](ROADMAP.md).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Using a real MySQL / PostgreSQL database

1. Open **Settings → Database connections**.
2. Create a vault passphrase (used to encrypt saved passwords).
3. Click **New connection**, fill in host / port / database / username /
   password, and hit **Test connection**.
4. Save. The connection now appears in the header's engine switcher.
5. Select it — the Playground page will connect and show tables, schemas, and
   run your queries against the real database.

> The Next.js server process must be able to reach the database (localhost,
> your LAN, or over the internet). The browser only talks to Next.js.

## Security notes

- Passwords are **never** stored in plaintext. AES-GCM ciphertext lives in
  IndexedDB alongside the rest of the profile metadata; the AES key lives in
  memory and is derived from your passphrase at unlock time.
- If you forget your passphrase, you must reset the vault (which wipes all
  saved connection profiles). There is no recovery path — that's intentional.
- API routes (`/api/db/postgres/*`, `/api/db/mysql/*`) accept the connection
  payload per-request and do not keep a pool. They are **not** authenticated;
  do not expose the Next.js server to the public internet with remote
  connections enabled.
- Use a read-only database user where possible when pointing PracticeQL at
  anything that matters.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com), emerald-accented palette
- [shadcn/ui](https://ui.shadcn.com) primitives (Base UI under the hood)
- [Zustand](https://github.com/pmndrs/zustand) for state
- [CodeMirror 6](https://codemirror.net)
- [sql.js](https://sql.js.org) (SQLite in WASM)
- [pg](https://node-postgres.com) + [mysql2](https://github.com/sidorares/node-mysql2)
  for server-side remote execution
- [idb](https://github.com/jakearchibald/idb) for IndexedDB

## Project layout

```
src/
  app/                       # Next.js routes
    api/db/{postgres,mysql}/ # Remote execution API (test/execute/schema)
    playground/              # SQL editor + results
    schema-builder/          # Visual CREATE TABLE
    tutorials/               # Lesson list + dynamic viewer
    tutorials/reference/     # SQL keyword reference
    challenges/              # Challenges list + detail
    settings/                # Theme, data, connections, danger zone
  components/
    connections/             # Vault panel + connection dialog/list
    layout/                  # Header, sidebar, engine switcher
    schema-builder/          # Column editor, SQL preview, table manager
    sql-editor/              # CodeMirror integration
    diagrams/                # JoinDiagram, ERDiagram, etc.
  content/
    tutorials/               # Tutorial React components
    challenges/              # Challenge specs + seed data
    sql-keywords.ts          # 100+ keyword entries
  hooks/
    use-sql-engine.ts        # SQLite engine hook
    use-active-engine.ts     # SQLite ↔ remote routing
  lib/
    crypto/vault.ts          # WebCrypto AES-GCM vault helpers
    db/
      connections-store.ts   # IndexedDB for encrypted connections
      persistence.ts         # IndexedDB for SQLite/history/progress
      sql-engine.ts          # sql.js wrapper
      remote/                # Server-side drivers (pg, mysql2)
      remote-engine.ts       # Client-side fetch adapter
  stores/                    # Zustand stores (db, editor, connection, ...)
  types/
    connection.ts            # Connection profile + vault types
    engine.ts, sql.ts        # Engine interfaces + result/schema types
```

## License

MIT
