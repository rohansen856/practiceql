import mysql, { ConnectionOptions, RowDataPacket, ResultSetHeader, FieldPacket } from "mysql2/promise";
import { ConnectionPayload } from "@/types/connection";
import { ColumnInfo, ForeignKeyInfo, QueryResult, TableInfo } from "@/types/sql";
import type { RemoteSchema } from "./postgres";

function toOptions(payload: ConnectionPayload): ConnectionOptions {
  return {
    host: payload.host,
    port: payload.port,
    database: payload.database,
    user: payload.username,
    password: payload.password,
    ssl: payload.ssl ? { rejectUnauthorized: false } : undefined,
    multipleStatements: false,
    rowsAsArray: true,
    dateStrings: true,
    connectTimeout: 8000,
  };
}

function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLine = false;
  let inBlock = false;
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
    if (inSingle) {
      buf += c;
      if (c === "\\" && next) {
        buf += next;
        i++;
      } else if (c === "'") inSingle = false;
      continue;
    }
    if (inDouble) {
      buf += c;
      if (c === "\\" && next) {
        buf += next;
        i++;
      } else if (c === '"') inDouble = false;
      continue;
    }
    if (inBacktick) {
      buf += c;
      if (c === "`") inBacktick = false;
      continue;
    }
    if (c === "-" && next === "-") {
      inLine = true;
      buf += c;
      continue;
    }
    if (c === "#") {
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
    if (c === "`") {
      inBacktick = true;
      buf += c;
      continue;
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

async function withConnection<T>(
  payload: ConnectionPayload,
  fn: (conn: mysql.Connection) => Promise<T>,
): Promise<T> {
  const conn = await mysql.createConnection(toOptions(payload));
  try {
    return await fn(conn);
  } finally {
    try {
      await conn.end();
    } catch {
      /* ignore */
    }
  }
}

export async function mysqlTest(payload: ConnectionPayload): Promise<string> {
  return withConnection(payload, async (conn) => {
    const [rows] = await conn.query("SELECT VERSION() AS version");
    const arr = rows as RowDataPacket[];
    return String(arr[0]?.version ?? "connected");
  });
}

function normalizeValue(v: unknown): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString();
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export async function mysqlExecute(
  payload: ConnectionPayload,
  sql: string,
): Promise<QueryResult[]> {
  return withConnection(payload, async (conn) => {
    const statements = splitStatements(sql);
    const results: QueryResult[] = [];
    for (const stmt of statements) {
      const start = performance.now();
      const [res, fields] = (await conn.query({
        sql: stmt,
        rowsAsArray: true,
      })) as [unknown, FieldPacket[]];
      const executionTimeMs = performance.now() - start;

      if (Array.isArray(res)) {
        const rows = res as unknown[][];
        const cols = (fields ?? []).map((f) => f.name);
        results.push({
          columns: cols,
          values: rows.map((row) => row.map(normalizeValue)),
          rowsAffected: rows.length,
          executionTimeMs,
        });
      } else {
        const header = res as ResultSetHeader;
        results.push({
          columns: [],
          values: [],
          rowsAffected: header.affectedRows ?? 0,
          executionTimeMs,
        });
      }
    }
    return results;
  });
}

export async function mysqlSchema(payload: ConnectionPayload): Promise<RemoteSchema> {
  return withConnection(payload, async (conn) => {
    // Force object-shape rows for these introspection queries because the
    // connection default is rowsAsArray:true (we want arrays for user-facing
    // query results, but named fields for metadata).
    const objQuery = async <T = RowDataPacket[]>(
      sql: string,
      values?: unknown[],
    ): Promise<T> => {
      const [rows] = await conn.query({ sql, rowsAsArray: false, values });
      return rows as T;
    };

    const tableRows = await objQuery<RowDataPacket[]>(
      `SELECT TABLE_NAME, TABLE_TYPE
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME`,
    );

    const out: RemoteSchema["tables"] = [];
    for (const t of tableRows) {
      const name = String(t.TABLE_NAME);
      const colRows = await objQuery<RowDataPacket[]>(
        `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION`,
        [name],
      );
      const columns: ColumnInfo[] = colRows.map((c) => ({
        name: String(c.COLUMN_NAME),
        type: String(c.COLUMN_TYPE).toUpperCase(),
        notNull: c.IS_NULLABLE === "NO",
        defaultValue: c.COLUMN_DEFAULT === null ? null : String(c.COLUMN_DEFAULT),
        primaryKey: c.COLUMN_KEY === "PRI",
      }));

      const fkRows = await objQuery<RowDataPacket[]>(
        `SELECT kcu.COLUMN_NAME AS col,
                kcu.REFERENCED_TABLE_NAME AS ref_table,
                kcu.REFERENCED_COLUMN_NAME AS ref_column,
                rc.DELETE_RULE AS on_delete,
                rc.UPDATE_RULE AS on_update
           FROM information_schema.KEY_COLUMN_USAGE kcu
           JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
             ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
          WHERE kcu.TABLE_SCHEMA = DATABASE()
            AND kcu.TABLE_NAME = ?
            AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`,
        [name],
      );
      const foreignKeys: ForeignKeyInfo[] = fkRows.map((r) => ({
        column: String(r.col),
        refTable: String(r.ref_table),
        refColumn: String(r.ref_column),
        onDelete: String(r.on_delete ?? ""),
        onUpdate: String(r.on_update ?? ""),
      }));

      let rowCount = 0;
      try {
        const countRows = await objQuery<RowDataPacket[]>(
          `SELECT COUNT(*) AS c FROM \`${name.replace(/`/g, "``")}\``,
        );
        rowCount = Number(countRows[0]?.c ?? 0);
      } catch {
        rowCount = 0;
      }

      const info: TableInfo = {
        name,
        type: String(t.TABLE_TYPE).toUpperCase() === "VIEW" ? "view" : "table",
      };
      out.push({ ...info, columns, foreignKeys, rowCount });
    }
    return { tables: out };
  });
}
