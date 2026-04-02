export interface QueryResult {
  columns: string[];
  values: (string | number | null | Uint8Array)[][];
  rowsAffected: number;
  executionTimeMs: number;
}

export interface TableInfo {
  name: string;
  type: "table" | "view";
}

export interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  defaultValue: string | null;
  primaryKey: boolean;
}

export interface ForeignKeyInfo {
  column: string;
  refTable: string;
  refColumn: string;
  onDelete: string;
  onUpdate: string;
}

export interface QueryError {
  message: string;
  sql?: string;
}
