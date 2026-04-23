"use client";

import { useCallback, useState } from "react";
import { SQLEditor } from "@/components/sql-editor/sql-editor";
import { SQLEditorToolbar } from "@/components/sql-editor/sql-editor-toolbar";
import { ResultsPanel } from "@/components/results/results-panel";
import { TableBrowser } from "@/components/shared/table-browser";
import { RemoteLockedGate } from "@/components/connections/remote-locked-gate";
import { useActiveEngine } from "@/hooks/use-active-engine";
import { useEditorStore } from "@/stores/editor-store";
import { useDBStore } from "@/stores/db-store";
import { useConnectionStore } from "@/stores/connection-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Server } from "lucide-react";
import { KIND_LABELS } from "@/types/connection";

export default function PlaygroundPage() {
  const sql = useEditorStore((s) => s.sql);
  const setSQL = useEditorStore((s) => s.setSQL);
  const history = useEditorStore((s) => s.history);
  const isEngineReady = useDBStore((s) => s.isEngineReady);
  const activeId = useConnectionStore((s) => s.activeId);
  const profiles = useConnectionStore((s) => s.profiles);
  const { executeSQL, mode, remoteLocked } = useActiveEngine("playground");
  const [showHistory, setShowHistory] = useState(false);

  const activeProfile = activeId
    ? profiles.find((p) => p.id === activeId) ?? null
    : null;

  const handleExecute = useCallback(
    (text?: string) => {
      const toExec = text ?? sql;
      if (toExec.trim()) {
        executeSQL(toExec);
      }
    },
    [sql, executeSQL]
  );

  if (remoteLocked) {
    return <RemoteLockedGate />;
  }

  if (!isEngineReady) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm text-muted-foreground">
          {mode === "remote"
            ? `Connecting to ${activeProfile?.name ?? "remote database"}...`
            : "Initializing SQL engine..."}
        </span>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel
        defaultSize={22}
        minSize={12}
        maxSize={45}
        id="sidebar"
      >
        <ScrollArea className="h-full">
          {mode === "remote" && activeProfile && (
            <div className="px-3 py-2 border-b bg-sky-500/5 flex items-center gap-2 text-xs">
              <Server className="h-3 w-3 text-sky-500 shrink-0" />
              <span className="font-medium truncate">
                {activeProfile.name}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] py-0 px-1 font-normal uppercase ml-auto"
              >
                {KIND_LABELS[activeProfile.kind]}
              </Badge>
            </div>
          )}
          <Tabs defaultValue="schema">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="schema" className="flex-1 text-xs">
                Schema
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 text-xs">
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="schema" className="m-0">
              <TableBrowser />
            </TabsContent>
            <TabsContent value="history" className="m-0">
              <div className="p-2 space-y-1">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No query history yet
                  </p>
                ) : (
                  history.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setSQL(item.sql)}
                      className="w-full text-left p-2 rounded-md hover:bg-muted text-xs font-mono truncate"
                    >
                      {item.sql.slice(0, 80)}
                    </button>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={78} id="main">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={45} minSize={15} id="editor">
            <div className="flex flex-col h-full">
              <SQLEditorToolbar
                sql={sql}
                onExecute={() => handleExecute()}
                onClear={() => setSQL("")}
                onToggleHistory={() => setShowHistory(!showHistory)}
              />
              <div className="flex-1 min-h-0">
                <SQLEditor
                  value={sql}
                  onChange={setSQL}
                  onExecute={handleExecute}
                  height="100%"
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55} minSize={15} id="results">
            <ScrollArea className="h-full">
              <ResultsPanel />
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
