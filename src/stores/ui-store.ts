import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  activePanel: "results" | "history" | "schema";
  editorHeight: number;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePanel: (panel: "results" | "history" | "schema") => void;
  setEditorHeight: (height: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePanel: "results",
  editorHeight: 300,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setEditorHeight: (height) => set({ editorHeight: height }),
}));
