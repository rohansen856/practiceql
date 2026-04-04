import { Challenge, ChallengeCategory } from "@/types/challenge";

export interface ChallengeSet {
  category: ChallengeCategory;
  label: string;
  description: string;
  challenges: Challenge[];
}
