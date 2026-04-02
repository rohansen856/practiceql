import { QueryResult, TableInfo, ColumnInfo, ForeignKeyInfo } from "./sql";

export interface SQLEngine {
  exec(sql: string): QueryResult[];
  getTables(): TableInfo[];
  getSchema(table: string): ColumnInfo[];
  getForeignKeys(table: string): ForeignKeyInfo[];
  getRowCount(table: string): number;
  serialize(): Uint8Array;
  load(data: Uint8Array): void;
  close(): void;
}

export type EngineType = "sqlite" | "postgresql" | "mysql" | "mongodb" | "cassandra" | "cockroachdb";

export interface EngineInfo {
  type: EngineType;
  name: string;
  description: string;
  available: boolean;
}

export const AVAILABLE_ENGINES: EngineInfo[] = [
  { type: "sqlite", name: "SQLite", description: "Lightweight, file-based SQL database", available: true },
  { type: "postgresql", name: "PostgreSQL", description: "Advanced open-source relational database", available: false },
  { type: "mysql", name: "MySQL", description: "Popular open-source relational database", available: false },
  { type: "mongodb", name: "MongoDB", description: "Document-oriented NoSQL database", available: false },
  { type: "cassandra", name: "Cassandra", description: "Distributed wide-column store", available: false },
  { type: "cockroachdb", name: "CockroachDB", description: "Distributed SQL database", available: false },
];
