"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSqlEngine } from "./use-sql-engine";
import { useConnectionStore } from "@/stores/connection-store";
import { useDBStore } from "@/stores/db-store";
import { useEditorStore } from "@/stores/editor-store";
import { executeRemote, fetchRemoteSchema } from "@/lib/db/remote-engine";
import { saveQuery } from "@/lib/db/persistence";
import { ColumnInfo, ForeignKeyInfo, TableInfo } from "@/types/sql";
import type { SqlDialect } from "@/lib/sql/dialect";

/**
 * Unified engine hook for the Playground.
 *
 * - When no remote connection is active, delegates to `useSqlEngine` (SQLite).
 * - When a remote connection is active AND the vault is unlocked,
 *   executes queries against the configured MySQL/PostgreSQL via API routes.
 */
export function useActiveEngine(sqliteDbName = "playground") {
  const activeId = useConnectionStore((s) => s.activeId);
  const vaultStatus = useConnectionStore((s) => s.vaultStatus);
  const getPayload = useConnectionStore((s) => s.getPayload);
  const activeProfile = useConnectionStore((s) =>
    s.activeId ? s.profiles.find((p) => p.id === s.activeId) ?? null : null,
  );
  const dialect: SqlDialect = activeProfile
    ? activeProfile.kind === "mysql"
      ? "mysql"
      : "postgresql"
    : "sqlite";

  const replaceCatalog = useDBStore((s) => s.replaceCatalog);
  const clearCatalog = useDBStore((s) => s.clearCatalog);
  const setResults = useDBStore((s) => s.setResults);
  const setError = useDBStore((s) => s.setError);
  const setIsExecuting = useDBStore((s) => s.setIsExecuting);
  const setIsEngineReady = useDBStore((s) => s.setIsEngineReady);
  const addToHistory = useEditorStore((s) => s.addToHistory);

  const isRemote = activeId !== null;
  const sqlite = useSqlEngine(sqliteDbName, { enabled: !isRemote });
  const remoteActive = isRemote && vaultStatus === "unlocked";
  const remoteLocked = isRemote && vaultStatus !== "unlocked";
  const lastActiveRef = useRef<string | null>(null);

  const refreshRemote = useCallback(async () => {
    if (!activeId) return;
    try {
      const payload = await getPayload(activeId);
      const schema = await fetchRemoteSchema(payload);
      const tables: TableInfo[] = schema.tables.map((t) => ({
        name: t.name,
        type: t.type,
      }));
      // Replace the entire catalog atomically so stale entries from a
      // previously-active connection (local SQLite or a different remote) can
      // never leak into the schema/foreign-key views.
      const schemas: Record<string, ColumnInfo[]> = {};
      const foreignKeys: Record<string, ForeignKeyInfo[]> = {};
      const rowCounts: Record<string, number> = {};
      for (const t of schema.tables) {
        schemas[t.name] = t.columns;
        foreignKeys[t.name] = t.foreignKeys;
        rowCounts[t.name] = t.rowCount;
      }
      replaceCatalog({ tables, schemas, foreignKeys, rowCounts });
      setIsEngineReady(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setIsEngineReady(false);
    }
  }, [activeId, getPayload, replaceCatalog, setIsEngineReady, setError]);

  useEffect(() => {
    if (!remoteActive) {
      lastActiveRef.current = null;
      return;
    }
    if (lastActiveRef.current === activeId) return;
    lastActiveRef.current = activeId;
    setIsEngineReady(false);
    // Drop the previous catalog so remote tables never mix with entries from
    // a different connection (local or another remote).
    clearCatalog();
    setResults([]);
    refreshRemote();
  }, [
    remoteActive,
    activeId,
    refreshRemote,
    setIsEngineReady,
    clearCatalog,
    setResults,
  ]);

  const executeRemoteSql = useCallback(
    async (sql: string) => {
      if (!activeId) return null;
      setIsExecuting(true);
      setError(null);
      try {
        const payload = await getPayload(activeId);
        const results = await executeRemote(payload, sql);
        setResults(results);
        addToHistory(sql);
        await saveQuery(sql, `remote:${activeId}`);

        const mutationPattern =
          /^\s*(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|REPLACE|TRUNCATE|GRANT|REVOKE)\b/i;
        if (mutationPattern.test(sql)) {
          await refreshRemote();
        }
        return results;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        return null;
      } finally {
        setIsExecuting(false);
      }
    },
    [
      activeId,
      getPayload,
      refreshRemote,
      addToHistory,
      setIsExecuting,
      setError,
      setResults,
    ],
  );

  if (remoteActive) {
    return {
      mode: "remote" as const,
      dialect,
      executeSQL: executeRemoteSql,
      refreshTables: refreshRemote,
      remoteLocked: false,
      canRun: true,
    };
  }

  if (remoteLocked) {
    return {
      mode: "remote" as const,
      dialect,
      executeSQL: async () => null,
      refreshTables: async () => {},
      remoteLocked: true,
      canRun: false,
    };
  }

  return {
    mode: "sqlite" as const,
    dialect: "sqlite" as const,
    executeSQL: sqlite.executeSQL,
    refreshTables: sqlite.refreshTables,
    remoteLocked: false,
    canRun: true,
  };
}
