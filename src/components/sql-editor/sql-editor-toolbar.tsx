"use client";

import { Play, Trash2, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDBStore } from "@/stores/db-store";

interface SQLEditorToolbarProps {
  onExecute: () => void;
  onClear: () => void;
  onToggleHistory?: () => void;
}

export function SQLEditorToolbar({
  onExecute,
  onClear,
  onToggleHistory,
}: SQLEditorToolbarProps) {
  const isExecuting = useDBStore((s) => s.isExecuting);

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
      <Button
        size="sm"
        onClick={onExecute}
        disabled={isExecuting}
        className="gap-1.5"
      >
        {isExecuting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        Run
      </Button>
      <span className="text-xs text-muted-foreground">Ctrl+Enter</span>
      <div className="flex-1" />
      {onToggleHistory && (
        <Button size="sm" variant="ghost" onClick={onToggleHistory}>
          <History className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onClear}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
