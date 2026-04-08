/**
 * SQL dialect helpers shared by the Schema Builder so that the generated
 * DDL/DML matches whichever engine is currently active.
 */

export type SqlDialect = "sqlite" | "mysql" | "postgresql";

export interface TypeGroup {
  label: string;
  types: string[];
}

export function quoteIdent(name: string, dialect: SqlDialect): string {
  if (dialect === "mysql") {
    return `\`${name.replace(/`/g, "``")}\``;
  }
  return `"${name.replace(/"/g, '""')}"`;
}

export function quoteLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Default starter column when a user lands in the Create Table form.
 * The returned shape must match `ColumnDef` from column-editor.tsx; we
 * keep it loosely typed here to avoid a circular import.
 */
export interface DialectPkColumnDefaults {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  autoIncrement: boolean;
}

export function defaultPkColumn(dialect: SqlDialect): DialectPkColumnDefaults {
  if (dialect === "mysql") {
    return {
      name: "id",
      type: "INT",
      primaryKey: true,
      notNull: true,
      autoIncrement: true,
    };
  }
  if (dialect === "postgresql") {
    return {
      name: "id",
      type: "SERIAL",
      primaryKey: true,
      notNull: true,
      autoIncrement: false,
    };
  }
  return {
    name: "id",
    type: "INTEGER",
    primaryKey: true,
    notNull: true,
    autoIncrement: false,
  };
}

/** Integer-ish type to use when a column is turned into a foreign key. */
export function defaultForeignKeyType(dialect: SqlDialect): string {
  if (dialect === "mysql") return "INT";
  return "INTEGER";
}

/** Types considered "integer-like" for the current dialect — used to gate
 * auto-increment UI. */
export function isIntegerType(type: string, dialect: SqlDialect): boolean {
  const t = type.trim().toUpperCase();
  if (dialect === "mysql") {
    return (
      t === "INT" ||
      t === "INTEGER" ||
      t === "BIGINT" ||
      t === "SMALLINT" ||
      t === "TINYINT" ||
      t === "MEDIUMINT"
    );
  }
  if (dialect === "postgresql") {
    return (
      t === "INTEGER" ||
      t === "INT" ||
      t === "BIGINT" ||
      t === "SMALLINT" ||
      t === "SERIAL" ||
      t === "BIGSERIAL" ||
      t === "SMALLSERIAL"
    );
  }
  return t === "INTEGER" || t === "INT";
}

export function defaultColumnTypes(dialect: SqlDialect): TypeGroup[] {
  if (dialect === "mysql") {
    return [
      {
        label: "Numeric",
        types: [
          "INT",
          "BIGINT",
          "SMALLINT",
          "TINYINT",
          "MEDIUMINT",
          "DECIMAL(10,2)",
          "FLOAT",
          "DOUBLE",
        ],
      },
      {
        label: "Text",
        types: ["VARCHAR(255)", "CHAR(10)", "TEXT", "MEDIUMTEXT", "LONGTEXT"],
      },
      {
        label: "Date / Time",
        types: ["DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR"],
      },
      { label: "Binary", types: ["BLOB", "MEDIUMBLOB", "LONGBLOB", "VARBINARY(255)"] },
      { label: "Boolean / Flags", types: ["BOOLEAN", "TINYINT(1)"] },
      { label: "JSON", types: ["JSON"] },
    ];
  }
  if (dialect === "postgresql") {
    return [
      {
        label: "Numeric",
        types: [
          "INTEGER",
          "BIGINT",
          "SMALLINT",
          "SERIAL",
          "BIGSERIAL",
          "NUMERIC(10,2)",
          "REAL",
          "DOUBLE PRECISION",
        ],
      },
      { label: "Text", types: ["TEXT", "VARCHAR(255)", "CHAR(10)"] },
      {
        label: "Date / Time",
        types: [
          "DATE",
          "TIME",
          "TIMESTAMP",
          "TIMESTAMPTZ",
          "INTERVAL",
        ],
      },
      { label: "Binary", types: ["BYTEA"] },
      { label: "Boolean / Flags", types: ["BOOLEAN"] },
      { label: "JSON", types: ["JSONB", "JSON"] },
      { label: "Other", types: ["UUID"] },
    ];
  }
  return [
    {
      label: "Numeric",
      types: [
        "INTEGER",
        "INT",
        "BIGINT",
        "SMALLINT",
        "REAL",
        "DOUBLE",
        "FLOAT",
        "NUMERIC",
        "DECIMAL(10,2)",
      ],
    },
    { label: "Text", types: ["TEXT", "VARCHAR(255)", "CHAR(10)"] },
    {
      label: "Date / Time",
      types: ["DATE", "TIME", "DATETIME", "TIMESTAMP"],
    },
    { label: "Binary", types: ["BLOB"] },
    { label: "Boolean / Flags", types: ["BOOLEAN"] },
    { label: "JSON", types: ["JSON"] },
  ];
}

/** Dialect-appropriate COLLATE suggestions for the advanced popover. */
export function defaultCollates(dialect: SqlDialect): string[] {
  if (dialect === "mysql") {
    return [
      "utf8mb4_general_ci",
      "utf8mb4_unicode_ci",
      "utf8mb4_bin",
      "latin1_swedish_ci",
    ];
  }
  if (dialect === "postgresql") {
    return ['"C"', '"POSIX"', '"en_US.utf8"', '"en_US"'];
  }
  return ["BINARY", "NOCASE", "RTRIM"];
}

/** Catalog / "show tables" starter query shown in the editor when the page
 * loads and the SQL box hasn't been customised. */
export function defaultCatalogQuery(dialect: SqlDialect): string {
  if (dialect === "mysql") return "SHOW TABLES;";
  if (dialect === "postgresql") {
    return "SELECT table_name\n  FROM information_schema.tables\n WHERE table_schema = current_schema();";
  }
  return "SELECT name FROM sqlite_master WHERE type='table';";
}

/** Set of known "default" snippets that we will auto-overwrite on
 * dialect change. */
export const KNOWN_DEFAULT_SNIPPETS: ReadonlySet<string> = new Set<string>([
  "SELECT * FROM sqlite_master;",
  "SELECT name FROM sqlite_master WHERE type='table';",
  "SHOW TABLES;",
  "SELECT table_name\n  FROM information_schema.tables\n WHERE table_schema = current_schema();",
]);
