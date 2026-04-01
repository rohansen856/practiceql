# PracticeQL - Development Roadmap

> **Goal:** A comprehensive, browser-only SQL learning platform. Custom table creation, guided tutorials from absolute beginner to senior-level, visual diagrams, and an extensible engine layer that starts with SQLite and grows to PostgreSQL, MySQL, MongoDB, and Cassandra.

Everything runs client-side. State persists in **IndexedDB**. No backend, no account, works offline after first load.

---

## Section A - Completed

| # | Feature | Status | Key files |
|---|---|---|---|
| A.1 | Landing page (`/`) with hero, features, learning path, CTA | ✅ | [src/app/page.tsx](src/app/page.tsx) |
| A.2 | App shell - sidebar + header + theme provider + toaster | ✅ | [src/app/layout.tsx](src/app/layout.tsx), [src/components/layout/](src/components/layout) |
| A.3 | SQL Playground (`/playground`) - CodeMirror editor, schema/history tabs, resizable panels, results panel | ✅ | [src/app/playground/page.tsx](src/app/playground/page.tsx), [src/components/sql-editor/](src/components/sql-editor), [src/components/results/](src/components/results) |
| A.4 | Schema Builder (`/schema-builder`) - create table form, column editor (types + constraints), live SQL preview, insert-data form, table manager with drop/export, embedded SQL editor + results | ✅ | [src/app/schema-builder/page.tsx](src/app/schema-builder/page.tsx), [src/components/schema-builder/](src/components/schema-builder) |
| A.5 | Challenges list (`/challenges`) - category filters, difficulty filters, per-category progress, overall completion | ✅ | [src/app/challenges/page.tsx](src/app/challenges/page.tsx), [src/components/challenges/](src/components/challenges) |
| A.6 | Challenge detail (`/challenges/[id]`) - workspace with description + progressive hints, editor, expected-vs-actual comparison, prev/next nav | ✅ | [src/app/challenges/[id]/page.tsx](src/app/challenges/%5Bid%5D/page.tsx) |
| A.7 | Visual diagram components - `JoinDiagram` (Venn), `ERDiagram`, `QueryFlowDiagram`, `TableVisualization` | ✅ | [src/components/diagrams/](src/components/diagrams) |
| A.8 | SQLite engine via `sql.js` WASM, served locally from `/public/sql-wasm.wasm` | ✅ | [src/lib/db/sql-engine.ts](src/lib/db/sql-engine.ts), [public/sql-wasm.wasm](public/sql-wasm.wasm) |
| A.9 | IndexedDB persistence via `idb` - stores for databases, progress, query history; debounced auto-save on mutations | ✅ | [src/lib/db/persistence.ts](src/lib/db/persistence.ts), [src/lib/db/db-manager.ts](src/lib/db/db-manager.ts) |
| A.10 | Zustand stores (`db-store`, `editor-store`, `progress-store`, `ui-store`) + `useSqlEngine` hook | ✅ | [src/stores/](src/stores), [src/hooks/use-sql-engine.ts](src/hooks/use-sql-engine.ts) |
| A.11 | `SQLEngine` interface pre-declared with `EngineType` union (`sqlite`/`postgresql`/`mysql`/`mongodb`/`cassandra`/`cockroachdb`) ready for extension | ✅ | [src/types/engine.ts](src/types/engine.ts) |
| A.12 | Seed datasets for challenges - employees/departments/projects/employee_projects, ecommerce (customers/products/orders/order_items), music (artists/albums/tracks) | ✅ | [src/content/challenges/seed-data.ts](src/content/challenges/seed-data.ts) |

---

## Section B - In progress / partially done

| # | Feature | Current state | Gap |
|---|---|---|---|
| B.1 | Guided tutorials | 2/18 content files written (`01-what-is-sql`, `02-select-basics` under `beginner/`). Registry with all 18 entries exists. | 16 tutorial content files missing; `/tutorials` and `/tutorials/[slug]` pages not implemented. |
| B.2 | Challenge content | 3/6 categories populated: WHERE (8), JOINs, Aggregation. | Subqueries, Window Functions, Advanced folders empty. |
| B.3 | Diagram usage inside tutorials | Components exist; only `TableVisualization` is referenced in `01-what-is-sql`. | Heavier use of `JoinDiagram`, `ERDiagram`, `QueryFlowDiagram` across JOIN / aggregation / query-processing tutorials. |

---

## Section C - Remaining feature work (priority order)

### C.1 Fill missing challenge content (HIGHEST PRIORITY - in flight)

Reuse the existing seed datasets in [src/content/challenges/seed-data.ts](src/content/challenges/seed-data.ts). Every new challenge's `expectedOutput` must be produced by running its `expectedQuery` against seed data - never hand-typed.

**Subqueries** → `src/content/challenges/subqueries/index.ts` (6 challenges):
1. Scalar subquery in WHERE - employees earning above company average.
2. Subquery returning single value - departments whose max salary exceeds a threshold.
3. Correlated subquery - products priced above their own category's average.
4. `EXISTS` - employees with at least one project assignment.
5. `NOT EXISTS` / `NOT IN` - customers who have never placed an order.
6. Derived table in FROM - top-N pattern (avg salary per department, then filter).

**Window Functions** → `src/content/challenges/window-functions/index.ts` (6 challenges - sql.js/SQLite 3.25+ supports all):
1. `ROW_NUMBER() OVER (ORDER BY ...)` - rank all employees by salary.
2. `RANK` vs `DENSE_RANK` with `PARTITION BY` - top earners per department.
3. Running total - `SUM(salary) OVER (ORDER BY hire_date)`.
4. `LAG` / `LEAD` - salary delta vs. previously hired employee.
5. Moving average - `AVG(total) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`.
6. `NTILE(4)` - split employees into salary quartiles.

**Advanced** → `src/content/challenges/advanced/index.ts` (6 challenges):
1. CTE referenced multiple times (`WITH high_earners AS ...`).
2. Recursive CTE - manager hierarchy depth.
3. `CASE` bucketing - salary bands Low / Mid / High with counts.
4. `COALESCE` + `NULLIF` - friendly labels for NULL `manager_id`.
5. `UNION` / `UNION ALL` - employees + synthetic contractors.
6. Combined pattern - CTE + window + JOIN for "rank within department".

Register the three new sets in [src/content/challenges/index.ts](src/content/challenges/index.ts). The `ChallengeCategory` union in [src/types/challenge.ts](src/types/challenge.ts) already accepts `subqueries`, `window-functions`, and `advanced`, so no type changes are required.

### C.2 Tutorials pages

- Folder `src/app/tutorials/[slug]/` already exists; settle on the flat route `/tutorials/[slug]` (the `[level]/[slug]` nested route proposed in the earlier draft is dropped - levels are captured in tutorial metadata, not the URL).
- **List page** `src/app/tutorials/page.tsx` - collapsible sections per level, tutorial cards with progress, next-up recommendation, visual learning path.
- **Viewer page** `src/app/tutorials/[slug]/page.tsx` - dynamic import of the matching content component from `src/content/tutorials/{level}/{nn-slug}.tsx`, sidebar TOC (auto from headings), prev/next nav, "Mark as complete" button wired to `progress-store`.
- Support components: `tutorial-card`, `level-section`, `learning-path`, `tutorial-viewer`, `table-of-contents` under `src/components/tutorials/`.
- Persist tutorial progress (saveTutorialProgress already exists in [src/lib/db/persistence.ts](src/lib/db/persistence.ts)); expose a `tutorialProgress` slice in `progress-store`.

### C.3 Tutorial content (16 remaining)

Beginner (4): `03-where-clause`, `04-ordering-and-limiting`, `05-insert-update-delete`, `06-creating-tables`.
Intermediate (5): `01-joins-explained`, `02-aggregation-grouping`, `03-subqueries`, `04-views-and-indexes`, `05-data-types-constraints`.
Advanced (4): `01-window-functions`, `02-ctes-recursive`, `03-query-optimization`, `04-transactions-acid`.
Expert (3): `01-advanced-joins`, `02-pivoting-unpivoting`, `03-real-world-patterns`.

**Visual learning rule:** each tutorial must embed at least one diagram from [src/components/diagrams/](src/components/diagrams) or a `TableVisualization` block. JOIN tutorials use `JoinDiagram` for each join type; intermediate+ tutorials featuring multiple tables should render an `ERDiagram`; query-processing and optimization tutorials should render a `QueryFlowDiagram` (FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT).

### C.4 Settings page (`/settings`)

Theme selector (light/dark/system via `next-themes`), editor preferences (font size, tab size, word wrap), reset all progress with confirmation, export/import progress JSON (uses `exportAllData` / `importAllData` already in persistence), DB management (list saved DBs, delete, export as SQL).

---

## Section D - Multi-engine track

The engine abstraction is the unlock for everything after SQLite. Do this before writing MySQL/Postgres-specific content so content stays portable.

### D.1 Engine registry

- Add `src/lib/engines/registry.ts` exposing `createEngineFor(type: EngineType, seedData?: Uint8Array)` and a map `EngineType → () => Promise<SQLEngine>`.
- Refactor [src/lib/db/db-manager.ts](src/lib/db/db-manager.ts) to call the registry instead of hard-coding `SqliteEngine`.
- Each engine lives in `src/lib/db/engines/<engine>-engine.ts` implementing the existing `SQLEngine` interface.

### D.2 Per-database engine metadata

- Bump the IndexedDB version in [src/lib/db/persistence.ts](src/lib/db/persistence.ts) (v1 → v2). Add `engineType: EngineType` to each `databases` record, default `"sqlite"` for existing rows during migration.
- `getEngine(name)` now reads the saved `engineType` and routes through the registry; `createEngine(name, seedSQL, engineType)` stores the chosen type.

### D.3 Engine selector UI

- Header / toolbar dropdown listing `AVAILABLE_ENGINES`. Unavailable engines show a "coming soon" badge and are disabled.
- Switching engines creates a new named DB (or switches to an existing one for that engine); it does **not** rewrite your SQLite data into Postgres.

### D.4 PostgreSQL adapter - PGlite

- `npm install @electric-sql/pglite`.
- `src/lib/db/engines/pglite-engine.ts` implements `SQLEngine` against PGlite's `PGlite` class. PGlite persists to IndexedDB natively (pass `idb://<dbName>`).
- `getTables` queries `pg_catalog.pg_tables`; `getSchema` queries `information_schema.columns`.
- Bundle size note: PGlite ships ~3.5 MB WASM. Lazy-load on first use; keep SQLite as the default engine.

### D.5 MySQL dialect-shim

- `src/lib/db/engines/mysql-shim-engine.ts` wraps `SqliteEngine`.
- SQL rewriter in `src/lib/db/dialects/mysql-to-sqlite.ts` handles the common cases:
  - `AUTO_INCREMENT` → `AUTOINCREMENT` (and `INTEGER PRIMARY KEY` implicit rowid).
  - Backtick identifiers → double-quoted.
  - `LIMIT offset, count` → `LIMIT count OFFSET offset`.
  - `ENGINE=InnoDB`, `DEFAULT CHARSET=...`, `COLLATE=...` → stripped.
  - `NOW()` / `CURRENT_TIMESTAMP()` → `CURRENT_TIMESTAMP`.
  - `IFNULL` stays (SQLite supports it); `ISNULL(x)` → `x IS NULL`.
  - Date functions `DATE_FORMAT` / `STR_TO_DATE` → `strftime` equivalents with a warning.
- UI banner inside the playground when MySQL mode is active: "MySQL dialect via SQLite shim (~90% fidelity)".

### D.6 MongoDB / Cassandra stubs

- Declare `NoSQLEngine` in [src/types/engine.ts](src/types/engine.ts) - takes a query string (MQL for Mongo, CQL for Cassandra) and returns either tabular rows or a tree view.
- Create stub adapter files that throw "Engine not yet implemented"; they exist only to lock the contract.
- Update `AVAILABLE_ENGINES` visual: `available: false, comingSoon: true`.

---

## Section E - Nice-to-have

- `EXPLAIN` query-plan visualizer (stepped tree, uses `QueryFlowDiagram` primitives).
- Shareable sandbox links - URL-encoded SQL + DB snapshot hash for one-click replay.
- CSV import wizard - paste CSV → column-type detection → `CREATE TABLE` + `INSERT` generation.
- Diagram theming pass - audit all SVG diagrams for light/dark parity.
- Mobile layout review for playground / challenge workspace (resizable panels → stacked tabs on narrow viewports).
- Achievement / streak system driven by `progress-store`.

---

## Execution order

| # | Task | Priority | Depends on |
|---|---|---|---|
| 1 | **C.1** - Subqueries, Window Functions, Advanced challenge content + registry wiring | HIGH | - |
| 2 | **C.2** - Tutorial list + viewer pages, persistence hookup | HIGH | - |
| 3 | **C.3** - Remaining 16 tutorial content files with mandatory diagrams | HIGH | C.2, diagrams (A.7) |
| 4 | **D.1–D.3** - Engine registry, IndexedDB migration, engine selector UI | HIGH | - |
| 5 | **D.4** - PGlite adapter | MEDIUM | D.1–D.3 |
| 6 | **D.5** - MySQL dialect-shim | MEDIUM | D.1–D.3 |
| 7 | **C.4** - Settings page | MEDIUM | - |
| 8 | **D.6** - Mongo / Cassandra stubs | LOW | D.1 |
| 9 | **Section E** - Polish / nice-to-haves | LOW | earlier phases |
