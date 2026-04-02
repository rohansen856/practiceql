export type TutorialLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface TutorialMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
  level: TutorialLevel;
  concepts: string[];
}

export interface TutorialProgress {
  slug: string;
  completed: boolean;
  completedAt?: number;
  lastVisited?: number;
}
