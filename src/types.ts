export type GamePhase = "setup" | "loading" | "categories" | "playing" | "finished";

export interface Question {
  prompt: string;
  category: string;
}

export interface GameState {
  phase: GamePhase;
  players: string[];
  questions: Question[];
  currentIndex: number;
  error: string | null;
}
