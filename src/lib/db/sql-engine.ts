import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import { SQLEngine } from "@/types/engine";
import { QueryResult, TableInfo, ColumnInfo, ForeignKeyInfo } from "@/types/sql";

let SQL: SqlJsStatic | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`,
    });
  }
  return SQL;
}

export class SqliteEngine implements SQLEngine {
  private db: Database;

  private constructor(db: Database) {
    this.db = db;
  }

  static async create(data?: Uint8Array): Promise<SqliteEngine> {
    const sqlJs = await getSqlJs();
    const db = data ? new sqlJs.Database(data) : new sqlJs.Database();
    return new SqliteEngine(db);
  }

  exec(sql: string): QueryResult[] {
    const start = performance.now();
    try {
      const rawResults = this.db.exec(sql);
      const elapsed = performance.now() - start;

      if (rawResults.length === 0) {
        const changes = this.db.getRowsModified();
        return [
          {
            columns: [],
            values: [],
            rowsAffected: changes,
            executionTimeMs: elapsed,
          },
        ];
      }

      return rawResults.map((r) => ({
        columns: r.columns,
        values: r.values as (string | number | null | Uint8Array)[][],
        rowsAffected: 0,
        executionTimeMs: elapsed,
      }));
    } catch (e) {
      const elapsed = performance.now() - start;
      throw {
        message: e instanceof Error ? e.message : String(e),
        executionTimeMs: elapsed,
      };
    }
  }

  getTables(): TableInfo[] {
    const results = this.db.exec(
      "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    if (results.length === 0) return [];
    return results[0].values.map((row) => ({
      name: row[0] as string,
      type: row[1] as "table" | "view",
    }));
  }

  getSchema(table: string): ColumnInfo[] {
    const results = this.db.exec(`PRAGMA table_info("${table}")`);
    if (results.length === 0) return [];
    return results[0].values.map((row) => ({
      name: row[1] as string,
      type: row[2] as string,
      notNull: (row[3] as number) === 1,
      defaultValue: row[4] as string | null,
      primaryKey: (row[5] as number) > 0,
    }));
  }

  getRowCount(table: string): number {
    try {
      const results = this.db.exec(`SELECT COUNT(*) FROM "${table}"`);
      if (results.length === 0) return 0;
      const raw = results[0].values[0]?.[0];
      return typeof raw === "number" ? raw : Number(raw) || 0;
    } catch {
      return 0;
    }
  }

  getForeignKeys(table: string): ForeignKeyInfo[] {
    const results = this.db.exec(`PRAGMA foreign_key_list("${table}")`);
    if (results.length === 0) return [];
    // PRAGMA foreign_key_list columns:
    // 0=id 1=seq 2=table 3=from 4=to 5=on_update 6=on_delete 7=match
    return results[0].values.map((row) => ({
      column: row[3] as string,
      refTable: row[2] as string,
      refColumn: (row[4] as string | null) ?? "",
      onUpdate: (row[5] as string | null) ?? "",
      onDelete: (row[6] as string | null) ?? "",
    }));
  }

  serialize(): Uint8Array {
    return this.db.export();
  }

  load(data: Uint8Array): void {
    const sqlJs = SQL!;
    this.db.close();
    this.db = new sqlJs.Database(data);
  }

  close(): void {
    this.db.close();
  }
}
