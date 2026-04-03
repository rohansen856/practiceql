import { create } from "zustand";
import { ChallengeProgress } from "@/types/challenge";
import {
  getAllChallengeProgress,
  saveChallengeProgress,
} from "@/lib/db/persistence";

interface ProgressState {
  challengeProgress: Record<string, ChallengeProgress>;
  tutorialProgress: Record<string, boolean>;
  loaded: boolean;

  loadProgress: () => Promise<void>;
  markChallengeComplete: (challengeId: string, sql: string) => Promise<void>;
  recordAttempt: (challengeId: string, sql: string) => Promise<void>;
  markTutorialComplete: (slug: string) => void;
  getCompletedCount: (category?: string) => number;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  challengeProgress: {},
  tutorialProgress: {},
  loaded: false,

  loadProgress: async () => {
    try {
      const all = await getAllChallengeProgress();
      const map: Record<string, ChallengeProgress> = {};
      for (const p of all) {
        map[p.challengeId] = p;
      }
      set({ challengeProgress: map, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  markChallengeComplete: async (challengeId, sql) => {
    const existing = get().challengeProgress[challengeId];
    const progress: ChallengeProgress = {
      challengeId,
      completed: true,
      completedAt: Date.now(),
      lastAttemptSQL: sql,
      attempts: (existing?.attempts ?? 0) + 1,
    };
    await saveChallengeProgress(progress);
    set((state) => ({
      challengeProgress: {
        ...state.challengeProgress,
        [challengeId]: progress,
      },
    }));
  },

  recordAttempt: async (challengeId, sql) => {
    const existing = get().challengeProgress[challengeId];
    const progress: ChallengeProgress = {
      challengeId,
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt,
      lastAttemptSQL: sql,
      attempts: (existing?.attempts ?? 0) + 1,
    };
    await saveChallengeProgress(progress);
    set((state) => ({
      challengeProgress: {
        ...state.challengeProgress,
        [challengeId]: progress,
      },
    }));
  },

  markTutorialComplete: (slug) =>
    set((state) => ({
      tutorialProgress: { ...state.tutorialProgress, [slug]: true },
    })),

  getCompletedCount: (category) => {
    const progress = get().challengeProgress;
    return Object.values(progress).filter((p) => {
      if (!p.completed) return false;
      if (category) return p.challengeId.startsWith(category);
      return true;
    }).length;
  },
}));
