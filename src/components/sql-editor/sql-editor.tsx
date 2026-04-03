"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { lineNumbers, highlightActiveLineGutter, highlightActiveLine } from "@codemirror/view";
import { useDBStore } from "@/stores/db-store";

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (sql: string) => void;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export function SQLEditor({
  value,
  onChange,
  onExecute,
  readOnly = false,
  height = "200px",
  className = "",
}: SQLEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const schemas = useDBStore((s) => s.schemas);

  const handleExecute = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;

    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    const textToExecute = selectedText.trim() || view.state.doc.toString();
    onExecute(textToExecute);
  }, [onExecute]);

  useEffect(() => {
    if (!editorRef.current) return;

    const schemaObj: Record<string, string[]> = {};
    for (const [table, cols] of Object.entries(schemas)) {
      schemaObj[table] = cols.map((c) => c.name);
    }

    const executeKeymap = keymap.of([
      {
        key: "Ctrl-Enter",
        mac: "Cmd-Enter",
        run: () => {
          handleExecute();
          return true;
        },
      },
    ]);

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      foldGutter(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      highlightSelectionMatches(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      sql({ dialect: SQLite, schema: schemaObj }),
      oneDark,
      executeKeymap,
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        ...closeBracketsKeymap,
        ...searchKeymap,
        ...foldKeymap,
      ]),
      placeholder("Write your SQL query here... (Ctrl+Enter to execute)"),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        "&": { height, maxHeight: "70vh" },
        ".cm-scroller": { overflow: "auto" },
        ".cm-content": { fontFamily: "var(--font-geist-mono), monospace" },
      }),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only recreate editor when schemas change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemas, readOnly, height]);

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={`border rounded-md overflow-hidden ${className}`}
    />
  );
}
