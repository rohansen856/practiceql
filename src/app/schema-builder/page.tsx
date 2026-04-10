"use client";

import { useCallback, useEffect, useRef } from "react";
import { useActiveEngine } from "@/hooks/use-active-engine";
import { useDBStore } from "@/stores/db-store";
import { useConnectionStore } from "@/stores/connection-store";
import { CreateTableForm } from "@/components/schema-builder/create-table-form";
import { InsertDataForm } from "@/components/schema-builder/insert-data-form";
import { TableManager } from "@/components/schema-builder/table-manager";
import { SQLEditor } from "@/components/sql-editor/sql-editor";
import { ResultsPanel } from "@/components/results/results-panel";
import { RemoteLockedGate } from "@/components/connections/remote-locked-gate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, Play, Server, Table2 } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { KIND_LABELS } from "@/types/connection";
import {
  defaultCatalogQuery,
  KNOWN_DEFAULT_SNIPPETS,
} from "@/lib/sql/dialect";

const DB_NAME = "schema-builder";

export default function SchemaBuilderPage() {
  const { executeSQL, refreshTables, mode, dialect, remoteLocked } =
    useActiveEngine(DB_NAME);
  const tables = useDBStore((s) => s.tables);
  const schemas = useDBStore((s) => s.schemas);
  const isEngineReady = useDBStore((s) => s.isEngineReady);
  const isExecuting = useDBStore((s) => s.isExecuting);
  const sql = useEditorStore((s) => s.sql);
  const setSQL = useEditorStore((s) => s.setSQL);
  const activeId = useConnectionStore((s) => s.activeId);
  const profiles = useConnectionStore((s) => s.profiles);

  const activeProfile = activeId
    ? profiles.find((p) => p.id === activeId) ?? null
    : null;

  // Seed the editor with a dialect-appropriate catalog query when the box
  // is empty or still contains a known default snippet from another dialect.
  const lastDialectRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastDialectRef.current === dialect) return;
    lastDialectRef.current = dialect;
    const trimmed = sql.trim();
    if (trimmed === "" || KNOWN_DEFAULT_SNIPPETS.has(trimmed)) {
      setSQL(defaultCatalogQuery(dialect));
    }
  }, [dialect, sql, setSQL]);

  const handleExecute = useCallback(
    async (sqlText: string) => {
      await executeSQL(sqlText);
      await refreshTables();
    },
    [executeSQL, refreshTables]
  );

  const handleEditorExecute = useCallback(() => {
    if (sql.trim()) handleExecute(sql);
  }, [sql, handleExecute]);

  if (remoteLocked) {
    return <RemoteLockedGate />;
  }

  if (!isEngineReady) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          {mode === "remote"
            ? `Connecting to ${activeProfile?.name ?? "remote database"}...`
            : "Initializing SQL engine..."}
        </span>
      </div>
    );
  }

  const engineLabel =
    mode === "remote" && activeProfile
      ? `${KIND_LABELS[activeProfile.kind]} · ${activeProfile.name}`
      : "SQLite (local)";

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left: Builder tools */}
      <ResizablePanel defaultSize={45} minSize={30}>
        <ScrollArea className="h-full">
          <div className="p-4 space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/25">
                <Database className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold tracking-tight">
                    Schema Builder
                  </h1>
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px] border-primary/20 bg-primary/5"
                  >
                    <Table2 className="h-2.5 w-2.5 text-primary" />
                    {tables.length} table{tables.length === 1 ? "" : "s"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      mode === "remote"
                        ? "gap-1 text-[10px] border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                        : "gap-1 text-[10px]"
                    }
                    title={engineLabel}
                  >
                    {mode === "remote" ? (
                      <Server className="h-2.5 w-2.5" />
                    ) : (
                      <Database className="h-2.5 w-2.5" />
                    )}
                    {engineLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create tables, define columns, and insert data visually.
                </p>
              </div>
            </div>

            <Tabs defaultValue="create">
              <TabsList className="w-full">
                <TabsTrigger value="create" className="flex-1 text-xs">
                  Create Table
                </TabsTrigger>
                <TabsTrigger value="insert" className="flex-1 text-xs">
                  Insert Data
                </TabsTrigger>
                <TabsTrigger value="tables" className="flex-1 text-xs">
                  Tables ({tables.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-4">
                <CreateTableForm
                  tableNames={tables.map((t) => t.name)}
                  dialect={dialect}
                  onExecute={handleExecute}
                />
              </TabsContent>

              <TabsContent value="insert" className="mt-4">
                <InsertDataForm
                  tables={tables}
                  schemas={schemas}
                  dialect={dialect}
                  onExecute={handleExecute}
                />
              </TabsContent>

              <TabsContent value="tables" className="mt-4">
                <TableManager
                  tables={tables}
                  schemas={schemas}
                  dialect={dialect}
                  onExecute={handleExecute}
                  onRefresh={refreshTables}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: SQL editor + results */}
      <ResizablePanel defaultSize={55}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={20}>
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground flex-1">
                  SQL Editor
                </span>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleEditorExecute}
                  disabled={isExecuting || !sql.trim()}
                >
                  {isExecuting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Run
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <SQLEditor
                  value={sql}
                  onChange={setSQL}
                  onExecute={handleEditorExecute}
                  height="100%"
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55} minSize={20}>
            <ScrollArea className="h-full">
              <ResultsPanel />
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
