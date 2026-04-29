/**
 * Curated reference material: CLI cheat sheets, connection-string recipes,
 * and external learning resources for users who land on `/developers`.
 */

export interface CheatRow {
  command: string;
  description: string;
}

export interface CheatGroup {
  id: string;
  title: string;
  subtitle: string;
  rows: CheatRow[];
}

export const CLI_CHEATS: CheatGroup[] = [
  {
    id: "psql",
    title: "psql",
    subtitle: "PostgreSQL's interactive terminal",
    rows: [
      {
        command: "psql postgresql://user:pass@host:5432/db",
        description: "Connect using a URL instead of flags",
      },
      { command: "\\l", description: "List databases" },
      { command: "\\dt", description: "List tables in the current schema" },
      { command: "\\d users", description: "Describe a table (columns, FKs, indexes)" },
      { command: "\\di", description: "List indexes" },
      { command: "\\dn", description: "List schemas" },
      { command: "\\du", description: "List roles/users" },
      { command: "\\x", description: "Toggle expanded (column-per-line) output" },
      { command: "\\timing on", description: "Show execution time for every query" },
      { command: "\\copy t FROM 'f.csv' CSV HEADER", description: "Bulk-load a CSV client-side" },
      { command: "\\q", description: "Quit" },
    ],
  },
  {
    id: "mysql",
    title: "mysql",
    subtitle: "MySQL's interactive client",
    rows: [
      {
        command: "mysql -h host -P 3306 -u user -p db",
        description: "Connect (password is prompted)",
      },
      { command: "SHOW DATABASES;", description: "List databases" },
      { command: "USE practiceql;", description: "Select the active database" },
      { command: "SHOW TABLES;", description: "List tables" },
      { command: "DESCRIBE users;", description: "Describe a table" },
      { command: "SHOW INDEX FROM users;", description: "List indexes on a table" },
      { command: "SHOW CREATE TABLE users;", description: "Print the exact DDL" },
      { command: "SHOW PROCESSLIST;", description: "See active connections/queries" },
      {
        command: "LOAD DATA LOCAL INFILE 'f.csv' INTO TABLE t FIELDS TERMINATED BY ','",
        description: "Bulk-load a CSV from the client",
      },
      { command: "exit", description: "Quit" },
    ],
  },
  {
    id: "docker",
    title: "docker compose",
    subtitle: "Managing the stacks above",
    rows: [
      { command: "docker compose up -d", description: "Start all services in the background" },
      { command: "docker compose ps", description: "See what's running" },
      { command: "docker compose logs -f postgres", description: "Tail logs for a single service" },
      { command: "docker compose exec postgres psql -U practiceql -d practiceql", description: "Open psql inside the running container" },
      { command: "docker compose restart mysql", description: "Restart one service" },
      { command: "docker compose down", description: "Stop everything (keep volumes)" },
      { command: "docker compose down -v", description: "Stop and wipe volumes (fresh DB)" },
    ],
  },
];

export interface ConnectionSample {
  id: string;
  language: string;
  title: string;
  snippet: string;
}

export const CONNECTION_SAMPLES: ConnectionSample[] = [
  {
    id: "url-postgres",
    language: "shell",
    title: "PostgreSQL URL",
    snippet: `postgresql://user:password@host:5432/database?sslmode=require`,
  },
  {
    id: "url-mysql",
    language: "shell",
    title: "MySQL URL",
    snippet: `mysql://user:password@host:3306/database?ssl-mode=REQUIRED`,
  },
  {
    id: "url-sqlite",
    language: "shell",
    title: "SQLite file",
    snippet: `sqlite:///absolute/path/to/app.db`,
  },
  {
    id: "node-pg",
    language: "typescript",
    title: "Node.js · pg",
    snippet: `import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const { rows } = await pool.query("SELECT now()");`,
  },
  {
    id: "node-mysql2",
    language: "typescript",
    title: "Node.js · mysql2",
    snippet: `import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL!);
const [rows] = await conn.query("SELECT NOW() as now");`,
  },
  {
    id: "python-psycopg",
    language: "python",
    title: "Python · psycopg",
    snippet: `import os, psycopg

with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT NOW()")
        print(cur.fetchone())`,
  },
  {
    id: "python-sqlalchemy",
    language: "python",
    title: "Python · SQLAlchemy",
    snippet: `from sqlalchemy import create_engine, text

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)
with engine.connect() as conn:
    print(conn.execute(text("SELECT 1")).scalar())`,
  },
  {
    id: "go-pgx",
    language: "go",
    title: "Go · pgx",
    snippet: `import (
    "context"
    "github.com/jackc/pgx/v5"
)

conn, err := pgx.Connect(ctx, os.Getenv("DATABASE_URL"))
if err != nil { panic(err) }
defer conn.Close(ctx)`,
  },
];

export interface Resource {
  title: string;
  description: string;
  url: string;
  level: "beginner" | "intermediate" | "advanced";
}

export const RESOURCES: Resource[] = [
  {
    title: "SQLBolt",
    description:
      "Interactive lessons that teach SQL from the very first SELECT. Every lesson has exercises you run in the browser.",
    url: "https://sqlbolt.com/",
    level: "beginner",
  },
  {
    title: "Mode · SQL Tutorial",
    description:
      "Thorough free tutorial covering basic through advanced SQL, written by the Mode Analytics team.",
    url: "https://mode.com/sql-tutorial",
    level: "beginner",
  },
  {
    title: "Select Star SQL (book)",
    description:
      "Free online book that teaches SQL through a single forensic dataset. Great for beginners who learn by story.",
    url: "https://selectstarsql.com/",
    level: "beginner",
  },
  {
    title: "PostgreSQL Tutorial",
    description:
      "Readable reference site with a practical example for every Postgres feature - aggregates, CTEs, window funcs, JSON.",
    url: "https://www.postgresqltutorial.com/",
    level: "intermediate",
  },
  {
    title: "Use The Index, Luke!",
    description:
      "A free book on SQL performance for developers - indexes, execution plans, query tuning.",
    url: "https://use-the-index-luke.com/",
    level: "intermediate",
  },
  {
    title: "Modern SQL (Markus Winand)",
    description:
      "Deep-dives on modern SQL features (window functions, JSON, LATERAL, MERGE) with dialect compatibility matrices.",
    url: "https://modern-sql.com/",
    level: "intermediate",
  },
  {
    title: "Crunchy Data · Postgres Tutorial",
    description:
      "In-browser Postgres playground with tutorials straight from the Crunchy Data team.",
    url: "https://www.crunchydata.com/developers/tutorials",
    level: "intermediate",
  },
  {
    title: "Designing Data-Intensive Applications",
    description:
      "Martin Kleppmann's canonical book on how real databases work - replication, consensus, storage engines.",
    url: "https://dataintensive.net/",
    level: "advanced",
  },
  {
    title: "Postgres Internals (PDF)",
    description:
      "Free deep-dive into how PostgreSQL actually works under the hood, maintained by Postgres Pro.",
    url: "https://postgrespro.com/community/books/internals",
    level: "advanced",
  },
  {
    title: "High Performance MySQL",
    description:
      "The definitive reference for MySQL tuning, indexing, and replication. Still a must-read in its 4th edition.",
    url: "https://www.oreilly.com/library/view/high-performance-mysql/9781492080503/",
    level: "advanced",
  },
  {
    title: "pgtune",
    description:
      "Generate a sensible postgresql.conf for your machine based on memory, cores, and workload type.",
    url: "https://pgtune.leopard.in.ua/",
    level: "advanced",
  },
  {
    title: "DB Fiddle",
    description:
      "Shareable sandboxes for Postgres, MySQL, SQLite, and more. Great for posting reproductions on Stack Overflow.",
    url: "https://www.db-fiddle.com/",
    level: "beginner",
  },
];

/** Small "do this, not that" callouts for production-minded devs. */
export interface ProductionTip {
  title: string;
  body: string;
}

export const PRODUCTION_TIPS: ProductionTip[] = [
  {
    title: "Never hardcode credentials in source",
    body:
      "Use environment variables and a secret manager (Doppler, 1Password Secrets, AWS Secrets Manager). Rotate DB passwords on every employee offboard.",
  },
  {
    title: "Always require SSL in production",
    body:
      "Append `?sslmode=require` (Postgres) or `?ssl-mode=REQUIRED` (MySQL) to your URL. Most managed providers enforce this already but never assume.",
  },
  {
    title: "Pool your connections",
    body:
      "Open one PgBouncer / mysqlslap pool per service, not one connection per request. Serverless providers like Neon expose a dedicated pooler endpoint - prefer it.",
  },
  {
    title: "Back up before every destructive DDL",
    body:
      "`pg_dump --format=custom` or `mysqldump --single-transaction` take seconds for small DBs and have saved many careers. Automate nightly.",
  },
  {
    title: "Read the query plan",
    body:
      "`EXPLAIN ANALYZE` on Postgres / `EXPLAIN FORMAT=JSON` on MySQL. Any full-table scan on a large table is a bug waiting to be a page.",
  },
  {
    title: "Index foreign keys",
    body:
      "Most engines do NOT auto-index FK columns - slow cascading deletes and joins follow. Add the index yourself.",
  },
];
