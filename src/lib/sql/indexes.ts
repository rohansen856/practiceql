/**
 * Dialect-aware helpers for listing and dropping secondary indexes on a
 * specific table. The Schema Builder's "Edit Table" dialog uses these to
 * surface a manageable view of indexes, hiding the implicit indexes that
 * every engine creates for primary keys / unique constraints.
 */

import type { QueryResult } from "@/types/sql";
import { quoteIdent, type SqlDialect } from "@/lib/sql/dialect";

export interface IndexInfo {
  /** The unique identifier the engine knows the index by. */
  name: string;
  /** Comma-separated column list, formatted for display. */
  columns: string;
  unique: boolean;
  /**
   * True when the index was implicitly created for a PRIMARY KEY constraint.
   * The UI should disable drop on these.
   */
  isPrimary: boolean;
  /**
   * True when the engine itself manages the index (e.g. SQLite's
   * `sqlite_autoindex_*`). These cannot be dropped without dropping the
   * underlying constraint.
   */
  isAuto: boolean;
}

/**
 * Returns the dialect-specific SQL that lists every index belonging to
 * `tableName`. The query is shaped so that the result columns line up across
 * dialects: name, columns, unique, isPrimary, isAuto.
 */
export function listIndexesQuery(
  tableName: string,
  dialect: SqlDialect,
): string {
  if (dialect === "sqlite") {
    // pragma_index_list yields (seq, name, unique, origin, partial). The
    // `origin` column is the source of truth for "this index is managed by
    // the engine":
    //   'c'  -> user CREATE INDEX (droppable)
    //   'u'  -> UNIQUE constraint  (engine-managed)
    //   'pk' -> PRIMARY KEY        (engine-managed)
    // Column names per index are pulled with a correlated subquery against
    // pragma_index_info so the result lines up with the other dialects.
    return `SELECT
        il.name AS name,
        COALESCE(
          (SELECT GROUP_CONCAT(ii.name, ', ')
             FROM pragma_index_info(il.name) ii),
          ''
        ) AS columns,
        CASE WHEN il."unique" = 1 THEN 1 ELSE 0 END AS is_unique,
        CASE WHEN il.origin = 'pk' THEN 1 ELSE 0 END AS is_primary,
        CASE WHEN il.origin IN ('pk', 'u') THEN 1 ELSE 0 END AS is_auto
      FROM pragma_index_list(${quoteLiteralSqlite(tableName)}) il
      ORDER BY il.name;`;
  }
  if (dialect === "mysql") {
    return `SELECT
        INDEX_NAME AS name,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') AS columns,
        MAX(CASE WHEN NON_UNIQUE = 0 THEN 1 ELSE 0 END) AS is_unique,
        CASE WHEN INDEX_NAME = 'PRIMARY' THEN 1 ELSE 0 END AS is_primary,
        0 AS is_auto
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${quoteLiteralMysql(tableName)}
      GROUP BY INDEX_NAME
      ORDER BY INDEX_NAME;`;
  }
  // PostgreSQL
  return `SELECT
      i.relname AS name,
      pg_get_indexdef(ix.indexrelid) AS columns,
      CASE WHEN ix.indisunique THEN 1 ELSE 0 END AS is_unique,
      CASE WHEN ix.indisprimary THEN 1 ELSE 0 END AS is_primary,
      0 AS is_auto
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    WHERE t.relname = ${quoteLiteralPg(tableName)}
      AND t.relkind = 'r'
    ORDER BY i.relname;`;
}

/** Coerce a result-set row produced by `listIndexesQuery` into IndexInfo[]. */
export function parseIndexesResult(
  result: QueryResult | null | undefined,
  dialect: SqlDialect,
): IndexInfo[] {
  if (!result) return [];
  const idx = (col: string) =>
    result.columns.findIndex((c) => c.toLowerCase() === col.toLowerCase());
  const nameIdx = idx("name");
  const columnsIdx = idx("columns");
  const uniqueIdx = idx("is_unique");
  const primaryIdx = idx("is_primary");
  const autoIdx = idx("is_auto");
  if (nameIdx < 0) return [];

  return result.values.map((row) => {
    const name = String(row[nameIdx] ?? "");
    let columns = columnsIdx >= 0 ? String(row[columnsIdx] ?? "") : "";
    if (dialect === "postgresql") {
      // pg_get_indexdef returns a full CREATE INDEX statement; trim it down
      // to the column list inside the trailing parens for readability.
      const m = columns.match(/\(([^)]*)\)\s*$/);
      columns = m ? m[1].trim() : columns;
    }
    return {
      name,
      columns,
      unique: Number(row[uniqueIdx] ?? 0) === 1,
      isPrimary: primaryIdx >= 0 ? Number(row[primaryIdx] ?? 0) === 1 : false,
      isAuto: autoIdx >= 0 ? Number(row[autoIdx] ?? 0) === 1 : false,
    };
  });
}

export function dropIndexSQL(
  index: IndexInfo,
  tableName: string,
  dialect: SqlDialect,
): string {
  if (dialect === "mysql") {
    return `DROP INDEX ${quoteIdent(index.name, dialect)} ON ${quoteIdent(tableName, dialect)};`;
  }
  return `DROP INDEX ${quoteIdent(index.name, dialect)};`;
}

export function createIndexSQL(
  tableName: string,
  column: string,
  options: { unique?: boolean; dialect: SqlDialect; name?: string } = {
    dialect: "sqlite",
  },
): string {
  const dialect = options.dialect;
  const name = options.name ?? `idx_${tableName}_${column}`;
  const keyword = options.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX";
  return `${keyword} ${quoteIdent(name, dialect)} ON ${quoteIdent(tableName, dialect)}(${quoteIdent(column, dialect)});`;
}

// ---- helpers: dialect-specific literal escaping ----

function quoteLiteralSqlite(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function quoteLiteralMysql(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function quoteLiteralPg(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
