import { create } from "zustand";
import { TableInfo, ColumnInfo, ForeignKeyInfo, QueryResult } from "@/types/sql";

interface DBState {
  currentDB: string;
  tables: TableInfo[];
  schemas: Record<string, ColumnInfo[]>;
  foreignKeys: Record<string, ForeignKeyInfo[]>;
  rowCounts: Record<string, number>;
  lastResults: QueryResult[];
  lastError: string | null;
  isExecuting: boolean;
  isEngineReady: boolean;

  setCurrentDB: (name: string) => void;
  setTables: (tables: TableInfo[]) => void;
  setSchema: (table: string, columns: ColumnInfo[]) => void;
  setForeignKeys: (table: string, fks: ForeignKeyInfo[]) => void;
  setRowCount: (table: string, count: number) => void;
  setResults: (results: QueryResult[]) => void;
  setError: (error: string | null) => void;
  setIsExecuting: (executing: boolean) => void;
  setIsEngineReady: (ready: boolean) => void;
  clearResults: () => void;
}

export const useDBStore = create<DBState>((set) => ({
  currentDB: "playground",
  tables: [],
  schemas: {},
  foreignKeys: {},
  rowCounts: {},
  lastResults: [],
  lastError: null,
  isExecuting: false,
  isEngineReady: false,

  setCurrentDB: (name) => set({ currentDB: name }),
  setTables: (tables) => set({ tables }),
  setSchema: (table, columns) =>
    set((state) => ({
      schemas: { ...state.schemas, [table]: columns },
    })),
  setForeignKeys: (table, fks) =>
    set((state) => ({
      foreignKeys: { ...state.foreignKeys, [table]: fks },
    })),
  setRowCount: (table, count) =>
    set((state) => ({
      rowCounts: { ...state.rowCounts, [table]: count },
    })),
  setResults: (results) => set({ lastResults: results, lastError: null }),
  setError: (error) => set({ lastError: error, lastResults: [] }),
  setIsExecuting: (executing) => set({ isExecuting: executing }),
  setIsEngineReady: (ready) => set({ isEngineReady: ready }),
  clearResults: () => set({ lastResults: [], lastError: null }),
}));
