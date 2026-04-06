import { Client, ClientConfig } from "pg";
import { ConnectionPayload } from "@/types/connection";
import { ColumnInfo, ForeignKeyInfo, QueryResult, TableInfo } from "@/types/sql";

function toClientConfig(payload: ConnectionPayload): ClientConfig {
  return {
    host: payload.host,
    port: payload.port,
    database: payload.database,
    user: payload.username,
    password: payload.password,
    ssl: payload.ssl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 8000,
    statement_timeout: 30000,
  };
}

async function withClient<T>(
  payload: ConnectionPayload,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client(toClientConfig(payload));
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

export async function pgTest(payload: ConnectionPayload): Promise<string> {
  return withClient(payload, async (client) => {
    const res = await client.query("SELECT version() as version");
    return String(res.rows[0]?.version ?? "connected");
  });
}

function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let inLine = false;
  let inBlock = false;
  let dollarTag: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const next = sql[i + 1];

    if (inLine) {
      if (c === "\n") inLine = false;
      buf += c;
      continue;
    }
    if (inBlock) {
      if (c === "*" && next === "/") {
        buf += "*/";
        i++;
        inBlock = false;
        continue;
      }
      buf += c;
      continue;
    }
    if (dollarTag) {
      if (c === "$" && sql.startsWith(dollarTag, i)) {
        buf += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
      } else {
        buf += c;
      }
      continue;
    }
    if (inSingle) {
      buf += c;
      if (c === "'" && next === "'") {
        buf += "'";
        i++;
      } else if (c === "'") {
        inSingle = false;
      }
      continue;
    }
    if (inDouble) {
      buf += c;
      if (c === '"') inDouble = false;
      continue;
    }

    if (c === "-" && next === "-") {
      inLine = true;
      buf += c;
      continue;
    }
    if (c === "/" && next === "*") {
      inBlock = true;
      buf += c;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      buf += c;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      buf += c;
      continue;
    }
    if (c === "$") {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        dollarTag = m[0];
        buf += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }
    if (c === ";") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export async function pgExecute(
  payload: ConnectionPayload,
  sql: string,
): Promise<QueryResult[]> {
  return withClient(payload, async (client) => {
    const statements = splitStatements(sql);
    const results: QueryResult[] = [];
    for (const stmt of statements) {
      const start = performance.now();
      const res = await client.query({ text: stmt, rowMode: "array" });
      const executionTimeMs = performance.now() - start;
      const fields = res.fields ?? [];
      if (fields.length > 0) {
        results.push({
          columns: fields.map((f) => f.name),
          values: (res.rows as unknown as (string | number | null)[][]).map((row) =>
            row.map((v) => normalizeValue(v)),
          ),
          rowsAffected: res.rowCount ?? 0,
          executionTimeMs,
        });
      } else {
        results.push({
          columns: [],
          values: [],
          rowsAffected: res.rowCount ?? 0,
          executionTimeMs,
        });
      }
    }
    return results;
  });
}

function normalizeValue(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export interface RemoteSchema {
  tables: (TableInfo & {
    columns: ColumnInfo[];
    foreignKeys: ForeignKeyInfo[];
    rowCount: number;
  })[];
}

export async function pgSchema(payload: ConnectionPayload): Promise<RemoteSchema> {
  return withClient(payload, async (client) => {
    const tableRows = await client.query(
      `SELECT table_name, table_type
         FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name`,
    );
    const tables = tableRows.rows as { table_name: string; table_type: string }[];

    const out: RemoteSchema["tables"] = [];
    for (const t of tables) {
      const colRes = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position`,
        [t.table_name],
      );
      const pkRes = await client.query(
        `SELECT a.attname AS column_name
           FROM pg_index i
           JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
          WHERE i.indrelid = $1::regclass AND i.indisprimary`,
        [`"${t.table_name}"`],
      ).catch(() => ({ rows: [] as { column_name: string }[] }));
      const pkSet = new Set(
        (pkRes.rows as { column_name: string }[]).map((r) => r.column_name),
      );
      const columns: ColumnInfo[] = (colRes.rows as {
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }[]).map((c) => ({
        name: c.column_name,
        type: c.data_type.toUpperCase(),
        notNull: c.is_nullable === "NO",
        defaultValue: c.column_default,
        primaryKey: pkSet.has(c.column_name),
      }));

      const fkRes = await client.query(
        `SELECT kcu.column_name AS column,
                ccu.table_name  AS ref_table,
                ccu.column_name AS ref_column,
                rc.delete_rule  AS on_delete,
                rc.update_rule  AS on_update
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu
             ON kcu.constraint_name = tc.constraint_name
            AND kcu.table_schema    = tc.table_schema
           JOIN information_schema.referential_constraints rc
             ON rc.constraint_name  = tc.constraint_name
            AND rc.constraint_schema= tc.table_schema
           JOIN information_schema.constraint_column_usage ccu
             ON ccu.constraint_name = tc.constraint_name
            AND ccu.constraint_schema = tc.table_schema
          WHERE tc.table_schema = 'public'
            AND tc.table_name   = $1
            AND tc.constraint_type = 'FOREIGN KEY'`,
        [t.table_name],
      ).catch(() => ({ rows: [] as {
        column: string;
        ref_table: string;
        ref_column: string;
        on_delete: string;
        on_update: string;
      }[] }));
      const foreignKeys: ForeignKeyInfo[] = (fkRes.rows as {
        column: string;
        ref_table: string;
        ref_column: string;
        on_delete: string;
        on_update: string;
      }[]).map((r) => ({
        column: r.column,
        refTable: r.ref_table,
        refColumn: r.ref_column,
        onDelete: r.on_delete,
        onUpdate: r.on_update,
      }));

      let rowCount = 0;
      try {
        const countRes = await client.query(
          `SELECT COUNT(*)::bigint AS c FROM "${t.table_name.replace(/"/g, '""')}"`,
        );
        rowCount = Number((countRes.rows[0] as { c: string | number })?.c ?? 0);
      } catch {
        rowCount = 0;
      }

      out.push({
        name: t.table_name,
        type: t.table_type === "VIEW" ? "view" : "table",
        columns,
        foreignKeys,
        rowCount,
      });
    }
    return { tables: out };
  });
}
