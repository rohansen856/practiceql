"use client";

import { useState } from "react";
import { Play, Trash2, History, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDBStore } from "@/stores/db-store";

interface SQLEditorToolbarProps {
  sql: string;
  onExecute: () => void;
  onClear: () => void;
  onToggleHistory?: () => void;
}

export function SQLEditorToolbar({
  sql,
  onExecute,
  onClear,
  onToggleHistory,
}: SQLEditorToolbarProps) {
  const isExecuting = useDBStore((s) => s.isExecuting);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = sql.trim();
    if (!text) {
      toast.info("Nothing to copy");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sql);
      } else {
        // Fallback for older browsers / non-secure contexts.
        const ta = document.createElement("textarea");
        ta.value = sql;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      toast.success("Query copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const hasSql = sql.trim().length > 0;

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
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        disabled={!hasSql}
        title="Copy query"
        aria-label="Copy query"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
      {onToggleHistory && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleHistory}
          title="Toggle history"
          aria-label="Toggle history"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        title="Clear editor"
        aria-label="Clear editor"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
