import { create } from "zustand";

interface EditorState {
  sql: string;
  history: { sql: string; timestamp: number }[];

  setSQL: (sql: string) => void;
  addToHistory: (sql: string) => void;
  clearHistory: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  sql: "SELECT * FROM sqlite_master;",
  history: [],

  setSQL: (sql) => set({ sql }),
  addToHistory: (sql) =>
    set((state) => ({
      history: [
        { sql, timestamp: Date.now() },
        ...state.history.slice(0, 99),
      ],
    })),
  clearHistory: () => set({ history: [] }),
}));
