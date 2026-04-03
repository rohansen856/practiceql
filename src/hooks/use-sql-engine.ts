"use client";

import { useEffect, useCallback } from "react";
import { getEngine, execAndPersist } from "@/lib/db/db-manager";
import { useDBStore } from "@/stores/db-store";
import { useEditorStore } from "@/stores/editor-store";
import { saveQuery } from "@/lib/db/persistence";

export function useSqlEngine(dbName?: string) {
  const currentDB = useDBStore((s) => s.currentDB);
  const setTables = useDBStore((s) => s.setTables);
  const setSchema = useDBStore((s) => s.setSchema);
  const setForeignKeys = useDBStore((s) => s.setForeignKeys);
  const setRowCount = useDBStore((s) => s.setRowCount);
  const setResults = useDBStore((s) => s.setResults);
  const setError = useDBStore((s) => s.setError);
  const setIsExecuting = useDBStore((s) => s.setIsExecuting);
  const setIsEngineReady = useDBStore((s) => s.setIsEngineReady);
  const addToHistory = useEditorStore((s) => s.addToHistory);

  const name = dbName ?? currentDB;

  useEffect(() => {
    let cancelled = false;
    setIsEngineReady(false);

    getEngine(name).then((engine) => {
      if (cancelled) return;
      setIsEngineReady(true);
      const tables = engine.getTables();
      setTables(tables);
      for (const t of tables) {
        setSchema(t.name, engine.getSchema(t.name));
        setForeignKeys(t.name, engine.getForeignKeys(t.name));
        setRowCount(t.name, engine.getRowCount(t.name));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [name, setIsEngineReady, setTables, setSchema, setForeignKeys, setRowCount]);

  const refreshTables = useCallback(async () => {
    const engine = await getEngine(name);
    const tables = engine.getTables();
    setTables(tables);
    for (const t of tables) {
      setSchema(t.name, engine.getSchema(t.name));
      setForeignKeys(t.name, engine.getForeignKeys(t.name));
      setRowCount(t.name, engine.getRowCount(t.name));
    }
  }, [name, setTables, setSchema, setForeignKeys, setRowCount]);

  const executeSQL = useCallback(
    async (sql: string) => {
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
    [name, setResults, setError, setIsExecuting, addToHistory, refreshTables]
  );

  return { executeSQL, refreshTables };
}
