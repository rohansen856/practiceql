# PracticeQL - Development Roadmap

> **Goal:** A comprehensive SQL learning platform with a browser-only default
> experience plus optional, credential-based connections to real MySQL and
> PostgreSQL databases. Custom table creation, guided tutorials (beginner →
> senior), visual diagrams, and an extensible engine layer.

Default experience runs **client-side** — `sql.js` (SQLite/WASM) plus
IndexedDB. Real-database support adds server-proxied execution through
Next.js API routes and an encrypted credential vault.

---

## Section A - Shipped

### A.1 Core learning UX
| # | Feature | Key files |
|---|---|---|
| A.1.1 | Landing page (`/`) | [src/app/page.tsx](src/app/page.tsx) |
| A.1.2 | App shell (sidebar, header with engine switcher, theme provider, toaster) | [src/app/layout.tsx](src/app/layout.tsx), [src/components/layout/](src/components/layout) |
| A.1.3 | SQL Playground (`/playground`) — CodeMirror editor, schema/history tabs, resizable panels, results panel | [src/app/playground/page.tsx](src/app/playground/page.tsx), [src/components/sql-editor/](src/components/sql-editor), [src/components/results/](src/components/results) |
| A.1.4 | Schema Builder (`/schema-builder`) — column editor, FK dropdowns with auto-type inference, single-PK enforcement, CHECK / COLLATE / GENERATED / WITHOUT ROWID, live SQL preview, insert-data form, table manager with row counts + FK badges | [src/app/schema-builder/page.tsx](src/app/schema-builder/page.tsx), [src/components/schema-builder/](src/components/schema-builder) |
| A.1.5 | Tutorials list + viewer (`/tutorials`, `/tutorials/[slug]`) | [src/app/tutorials/](src/app/tutorials) |
| A.1.6 | SQL Keyword Reference (`/tutorials/reference/keywords`) — 100+ keywords, searchable | [src/content/sql-keywords.ts](src/content/sql-keywords.ts), [src/app/tutorials/reference/keywords/page.tsx](src/app/tutorials/reference/keywords/page.tsx) |
| A.1.7 | Challenges list + detail (`/challenges`, `/challenges/[id]`) with progressive hints, expected-vs-actual comparison, prev/next nav | [src/app/challenges/](src/app/challenges), [src/components/challenges/](src/components/challenges) |
| A.1.8 | Settings page (`/settings`) — theme, saved DBs, connections, backup/restore, danger zone | [src/app/settings/page.tsx](src/app/settings/page.tsx) |
| A.1.9 | Diagrams — `JoinDiagram`, `ERDiagram`, `QueryFlowDiagram`, `TableVisualization` | [src/components/diagrams/](src/components/diagrams) |

### A.2 SQLite engine (default)
- `sql.js` via WASM served from `/public/sql-wasm.wasm`.
- IndexedDB persistence for databases, query history, and progress (`idb`).
- `SQLEngine` interface with `getForeignKeys` (via `PRAGMA foreign_key_list`)
  and `getRowCount` (via `SELECT COUNT(*)`).
- Zustand stores (`db-store`, `editor-store`, `progress-store`, `ui-store`)
  and `useSqlEngine` hook with an `enabled` flag for clean coexistence with
  remote engines.

Key files: [src/lib/db/sql-engine.ts](src/lib/db/sql-engine.ts),
[src/lib/db/persistence.ts](src/lib/db/persistence.ts),
[src/lib/db/db-manager.ts](src/lib/db/db-manager.ts),
[src/hooks/use-sql-engine.ts](src/hooks/use-sql-engine.ts),
[src/stores/](src/stores).

### A.3 Content
- Tutorials across beginner / intermediate / advanced tracks (SELECT basics,
  WHERE, ordering, INSERT/UPDATE/DELETE, DDL, JOINs, aggregation, HAVING,
  subqueries, set operations, date/time, views, indexes, constraints design,
  triggers, window functions, CTEs, query processing, …).
- Challenge sets for WHERE, JOINs, aggregation, subqueries, window functions,
  HAVING, indexes, constraints, complex queries, advanced.

### A.4 Multi-engine: real MySQL + PostgreSQL (credential-based) ✅
Added after user request. Delivered as an **optional** layer that sits
alongside the browser-only SQLite default.

| # | Piece | Files |
|---|---|---|
| A.4.1 | `ConnectionProfile` / vault / engine types | [src/types/connection.ts](src/types/connection.ts) |
| A.4.2 | WebCrypto vault — PBKDF2 → AES-GCM, salt + ciphertext verifier in IndexedDB, passphrase unlocks in-memory key only | [src/lib/crypto/vault.ts](src/lib/crypto/vault.ts) |
| A.4.3 | Connections IndexedDB store (`practiceql-connections`, separate from main DB) | [src/lib/db/connections-store.ts](src/lib/db/connections-store.ts) |
| A.4.4 | Zustand `connection-store` — vault status, profiles metadata, active id, CRUD, `getPayload(id)` that decrypts on demand | [src/stores/connection-store.ts](src/stores/connection-store.ts) |
| A.4.5 | Server-side drivers with statement splitter, parameter validation, timeouts | [src/lib/db/remote/postgres.ts](src/lib/db/remote/postgres.ts), [src/lib/db/remote/mysql.ts](src/lib/db/remote/mysql.ts), [src/lib/db/remote/validate.ts](src/lib/db/remote/validate.ts) |
| A.4.6 | API routes: `POST /api/db/{postgres,mysql}/{test,execute,schema}` | [src/app/api/db/](src/app/api/db) |
| A.4.7 | Client-side fetch adapter (`testRemote`, `executeRemote`, `fetchRemoteSchema`) | [src/lib/db/remote-engine.ts](src/lib/db/remote-engine.ts) |
| A.4.8 | UI — vault setup/unlock/lock/reset panel, connection dialog with Test Connection, connection list, engine switcher in the header | [src/components/connections/](src/components/connections), [src/components/layout/engine-switcher.tsx](src/components/layout/engine-switcher.tsx) |
| A.4.9 | Playground routing — `useActiveEngine()` hook transparently switches between SQLite and remote; disables the SQLite hook when remote is active to avoid races | [src/hooks/use-active-engine.ts](src/hooks/use-active-engine.ts) |
| A.4.10 | Settings integration — Database connections card with vault panel + connection list | [src/app/settings/page.tsx](src/app/settings/page.tsx) |

**Security posture:** credentials encrypted client-side (AES-GCM, 210k PBKDF2
iterations). Plaintext exists only in the request body sent to the Next.js
server on user action, and on the server only for the duration of a single
query. No pooling, no persistence on the server, no auth bypass.

---

## Section B - In progress / partially done

| # | Feature | Current state | Gap |
|---|---|---|---|
| B.1 | Tutorial diagram coverage | Each tutorial embeds at least one `InteractiveSQLBlock` or `TableVisualization`; heavier `JoinDiagram` / `ERDiagram` usage varies | Audit JOIN / query-processing tutorials and ensure every concept has a dedicated visual. |
| B.2 | Remote engine support in Schema Builder | Schema Builder currently targets SQLite only (creates / drops / inspects with `PRAGMA`) | Either (a) gate the Schema Builder to SQLite and surface a clear banner when a remote connection is active, or (b) add engine-specific SQL generation (`SERIAL` vs `INTEGER AUTOINCREMENT`, backtick vs double-quote identifiers) and remote DDL. Currently ungated — if you select a remote engine, the Schema Builder page will still show your SQLite schema. This is confusing; tracking as a priority gap. |
| B.3 | Progressive remote fallback for the Playground | Active remote connection writes through the API route on every query | Add optional connection pooling / keep-alive behind a feature flag for heavy sessions. |

---

## Section C - Planned (priority order)

### C.1 Engine-aware Schema Builder
- Detect active engine via `useConnectionStore().activeId`.
- When remote, disable "Save to database" and swap the SQL preview to the
  target dialect; alternatively, issue DDL via `executeRemote`.
- Dialect-aware type palette (e.g., `SERIAL` / `BIGSERIAL` / `UUID` for
  Postgres, `AUTO_INCREMENT` / `TINYINT(1)` for MySQL).

### C.2 Remote connection polish
- **Pooling** — opt-in connection reuse per browser tab, with idle timeout and
  "disconnect" UI.
- **Query cancellation** — the `pg` client supports `cancel()`; wire it up to
  the Playground's cancel button.
- **Streaming rows** — large result sets currently round-trip through a JSON
  response. For >50k rows, switch to NDJSON streaming.
- **Read-only mode** — per-profile toggle that prepends `SET TRANSACTION READ
  ONLY` (Postgres) or rejects mutating statements (MySQL).
- **Connection test detail** — surface latency and server-reported charset /
  timezone in the Test Connection result.

### C.3 PGlite adapter (browser-only Postgres)
- `npm install @electric-sql/pglite`.
- `src/lib/db/engines/pglite-engine.ts` implementing `SQLEngine` against
  PGlite's `PGlite` class. Persists to IndexedDB natively (`idb://<dbName>`).
- Bundle size note: ~3.5 MB WASM. Lazy-load on first use; keep SQLite as the
  default.
- Use cases: Postgres-flavored tutorials and challenges that don't need a
  real server.

### C.4 MySQL dialect-shim (browser-only MySQL-ish)
- `src/lib/db/engines/mysql-shim-engine.ts` wraps `SqliteEngine`.
- SQL rewriter in `src/lib/db/dialects/mysql-to-sqlite.ts` for:
  - `AUTO_INCREMENT` → `AUTOINCREMENT` (and `INTEGER PRIMARY KEY` implicit
    rowid).
  - Backtick identifiers → double-quoted.
  - `LIMIT offset, count` → `LIMIT count OFFSET offset`.
  - `ENGINE=InnoDB`, `DEFAULT CHARSET=...`, `COLLATE=...` → stripped.
  - `NOW()` / `CURRENT_TIMESTAMP()` → `CURRENT_TIMESTAMP`.
  - `ISNULL(x)` → `x IS NULL`.
  - Date functions `DATE_FORMAT` / `STR_TO_DATE` → `strftime` equivalents
    with a warning banner.
- UI banner: "MySQL dialect via SQLite shim (~90% fidelity)".

### C.5 NoSQL stubs
- Declare `NoSQLEngine` in [src/types/engine.ts](src/types/engine.ts) —
  takes a query string (MQL / CQL) and returns tabular rows or a tree view.
- Stub adapter files that throw "Engine not yet implemented"; they exist only
  to lock the contract.
- Update `AVAILABLE_ENGINES` with `available: false, comingSoon: true`.

### C.6 Nice-to-haves
- `EXPLAIN` query-plan visualizer (stepped tree, uses `QueryFlowDiagram`
  primitives). Engine-aware: `EXPLAIN QUERY PLAN` on SQLite,
  `EXPLAIN (FORMAT JSON, ANALYZE false)` on Postgres, `EXPLAIN FORMAT=JSON` on
  MySQL.
- Shareable sandbox links — URL-encoded SQL + DB snapshot hash for one-click
  replay.
- CSV import wizard — paste CSV → column-type detection → `CREATE TABLE` +
  `INSERT` generation.
- Diagram theming audit for light/dark parity.
- Mobile layout review for playground / challenge workspace (resizable panels
  → stacked tabs on narrow viewports).
- Achievement / streak system driven by `progress-store`.

---

## Execution order

| # | Task | Priority | Depends on |
|---|---|---|---|
| 1 | **C.1** — Engine-aware Schema Builder (at least: gate + banner) | HIGH | A.4 (done) |
| 2 | **C.2** — Remote connection polish (pooling, cancel, streaming, read-only) | HIGH | A.4 (done) |
| 3 | **B.1** — Diagram coverage audit across existing tutorials | MEDIUM | — |
| 4 | **C.3** — PGlite adapter | MEDIUM | — |
| 5 | **C.4** — MySQL dialect-shim | MEDIUM | — |
| 6 | **C.5** — NoSQL stub contracts | LOW | — |
| 7 | **C.6** — Nice-to-haves | LOW | earlier phases |

---

## Operational notes

- The Next.js server process must be able to reach any real DB you connect
  to. Browsers never speak the wire protocol directly; API routes do.
- API routes (`/api/db/*`) are unauthenticated and accept a full connection
  payload per-request. Do not expose this Next.js server to untrusted networks
  while remote connections are enabled.
- The vault passphrase is not recoverable. Forgotten passphrase → reset the
  vault (wipes profiles), re-add connections.
- SQLite remains the sole engine for tutorials and challenges so those stay
  deterministic and offline.
