"use client";

import { useEffect, useCallback } from "react";
import { getEngine, execAndPersist } from "@/lib/db/db-manager";
import { useDBStore } from "@/stores/db-store";
import { useEditorStore } from "@/stores/editor-store";
import { saveQuery } from "@/lib/db/persistence";
import { ColumnInfo, ForeignKeyInfo } from "@/types/sql";

interface UseSqlEngineOptions {
  enabled?: boolean;
}

export function useSqlEngine(
  dbName?: string,
  options: UseSqlEngineOptions = {},
) {
  const enabled = options.enabled ?? true;
  const currentDB = useDBStore((s) => s.currentDB);
  const replaceCatalog = useDBStore((s) => s.replaceCatalog);
  const clearCatalog = useDBStore((s) => s.clearCatalog);
  const setResults = useDBStore((s) => s.setResults);
  const setError = useDBStore((s) => s.setError);
  const setIsExecuting = useDBStore((s) => s.setIsExecuting);
  const setIsEngineReady = useDBStore((s) => s.setIsEngineReady);
  const addToHistory = useEditorStore((s) => s.addToHistory);

  const name = dbName ?? currentDB;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setIsEngineReady(false);
    // The previous engine's catalog (e.g. from a remote connection the user
    // just turned off) must be cleared before we start loading SQLite tables.
    clearCatalog();

    getEngine(name).then((engine) => {
      if (cancelled) return;
      const tables = engine.getTables();
      const schemas: Record<string, ColumnInfo[]> = {};
      const foreignKeys: Record<string, ForeignKeyInfo[]> = {};
      const rowCounts: Record<string, number> = {};
      for (const t of tables) {
        schemas[t.name] = engine.getSchema(t.name);
        foreignKeys[t.name] = engine.getForeignKeys(t.name);
        rowCounts[t.name] = engine.getRowCount(t.name);
      }
      replaceCatalog({ tables, schemas, foreignKeys, rowCounts });
      setIsEngineReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, name, setIsEngineReady, replaceCatalog, clearCatalog]);

  const refreshTables = useCallback(async () => {
    if (!enabled) return;
    const engine = await getEngine(name);
    const tables = engine.getTables();
    const schemas: Record<string, ColumnInfo[]> = {};
    const foreignKeys: Record<string, ForeignKeyInfo[]> = {};
    const rowCounts: Record<string, number> = {};
    for (const t of tables) {
      schemas[t.name] = engine.getSchema(t.name);
      foreignKeys[t.name] = engine.getForeignKeys(t.name);
      rowCounts[t.name] = engine.getRowCount(t.name);
    }
    replaceCatalog({ tables, schemas, foreignKeys, rowCounts });
  }, [enabled, name, replaceCatalog]);

  const executeSQL = useCallback(
    async (sql: string) => {
      if (!enabled) return null;
      setIsExecuting(true);
      setError(null);

      try {
        const results = execAndPersist(name, sql);
        setResults(results);
        addToHistory(sql);
        await saveQuery(sql, name);

        // Refresh tables if mutation
        const mutationPattern =
          /^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|REPLACE)\b/i;
        if (mutationPattern.test(sql)) {
          await refreshTables();
        }

        return results;
      } catch (e: unknown) {
        const message =
          e && typeof e === "object" && "message" in e
            ? (e as { message: string }).message
            : String(e);
        setError(message);
        return null;
      } finally {
        setIsExecuting(false);
      }
    },
    [enabled, name, setResults, setError, setIsExecuting, addToHistory, refreshTables]
  );

  return { executeSQL, refreshTables };
}
