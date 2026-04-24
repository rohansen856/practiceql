"use client";

import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2, Network, Server } from "lucide-react";
import { useActiveEngine } from "@/hooks/use-active-engine";
import { useDBStore } from "@/stores/db-store";
import { useConnectionStore } from "@/stores/connection-store";
import { RemoteLockedGate } from "@/components/connections/remote-locked-gate";
import { SchemaCanvas } from "@/components/visualization/schema-canvas";
import { IndexBTreeCanvas } from "@/components/visualization/index-btree-canvas";
import { JoinCanvas } from "@/components/visualization/join-canvas";
import { KIND_LABELS } from "@/types/connection";

export default function VisualizationPage() {
  const { executeSQL, refreshTables, mode, dialect, remoteLocked } =
    useActiveEngine();
  const tables = useDBStore((s) => s.tables);
  const schemas = useDBStore((s) => s.schemas);
  const foreignKeys = useDBStore((s) => s.foreignKeys);
  const isEngineReady = useDBStore((s) => s.isEngineReady);
  const activeId = useConnectionStore((s) => s.activeId);
  const profiles = useConnectionStore((s) => s.profiles);
  const activeProfile = activeId
    ? profiles.find((p) => p.id === activeId) ?? null
    : null;

  // Make sure schemas/FKs are populated even when the user navigates here
  // directly (e.g. deep link) without visiting the Playground first.
  useEffect(() => {
    if (isEngineReady && tables.length === 0 && !remoteLocked) {
      void refreshTables();
    }
  }, [isEngineReady, tables.length, remoteLocked, refreshTables]);

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
    <div className="flex flex-col h-full min-h-0 p-4 gap-4">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-500/25">
          <Network className="h-4.5 w-4.5 text-fuchsia-600 dark:text-fuchsia-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight">
              Visualization
            </h1>
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] border-primary/20 bg-primary/5"
            >
              <Database className="h-2.5 w-2.5 text-primary" />
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
            Explore your schema, index structure, and join behaviour on an
            interactive canvas.
          </p>
        </div>
      </header>

      <Tabs defaultValue="erd" className="flex-1 flex flex-col min-h-0">
        <TabsList className="self-start">
          <TabsTrigger value="erd" className="text-xs gap-1.5">
            <Network className="h-3 w-3" />
            Schema (ERD)
          </TabsTrigger>
          <TabsTrigger value="indexes" className="text-xs gap-1.5">
            Index B-Tree
          </TabsTrigger>
          <TabsTrigger value="joins" className="text-xs gap-1.5">
            Joins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="erd" className="flex-1 min-h-0 mt-3">
          {tables.length === 0 ? (
            <EmptyTables />
          ) : (
            <SchemaCanvas
              tables={tables}
              schemas={schemas}
              foreignKeys={foreignKeys}
            />
          )}
        </TabsContent>

        <TabsContent value="indexes" className="flex-1 min-h-0 mt-3">
          {tables.length === 0 ? (
            <EmptyTables />
          ) : (
            <IndexBTreeCanvas
              tables={tables}
              schemas={schemas}
              dialect={dialect}
              executeSQL={executeSQL}
            />
          )}
        </TabsContent>

        <TabsContent value="joins" className="flex-1 min-h-0 mt-3">
          {tables.length === 0 ? (
            <EmptyTables />
          ) : (
            <JoinCanvas
              tables={tables}
              schemas={schemas}
              foreignKeys={foreignKeys}
              dialect={dialect}
              executeSQL={executeSQL}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTables() {
  return (
    <div className="flex items-center justify-center h-full rounded-md border border-dashed text-sm text-muted-foreground">
      <div className="flex flex-col items-center gap-2 p-6 text-center">
        <Database className="h-6 w-6 opacity-50" />
        <p className="font-medium">No tables in this database yet</p>
        <p className="text-xs max-w-sm">
          Head to the Schema Builder or Playground to create tables — they will
          appear here as an interactive ERD, index tree, and join preview.
        </p>
      </div>
    </div>
  );
}
