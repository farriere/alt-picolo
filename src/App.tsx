import { useCallback, useState } from "react";
import type { GamePhase, Question } from "./types";
import { fetchQuestionsFromSheet } from "./utils/sheets";
import { shuffleArray } from "./utils/gameUtils";
import Setup from "./components/Setup";
import GameCard from "./components/GameCard";
import CategoryPicker from "./components/CategoryPicker";
import FinishScreen from "./components/FinishScreen";
import "./App.css";

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(
    async (playerNames: string[], sheetId: string) => {
      setError(null);
      setPhase("loading");
      try {
        const fetched = await fetchQuestionsFromSheet(sheetId);
        setPlayers(playerNames);
        setAllQuestions(fetched);
        setPhase("categories");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
        setPhase("setup");
      }
    },
    [],
  );

  const handleConfirmCategories = useCallback(
    (selected: Set<string>) => {
      const filtered = allQuestions.filter((q) =>
        selected.has(q.category || "Uncategorized"),
      );
      setQuestions(shuffleArray(filtered));
      setCurrentIndex(0);
      setPhase("playing");
    },
    [allQuestions],
  );

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => {
      if (i + 1 >= questions.length) {
        setPhase("finished");
        return i;
      }
      return i + 1;
    });
  }, [questions.length]);

  const handleRestart = useCallback(() => {
    setPhase("setup");
    setPlayers([]);
    setAllQuestions([]);
    setQuestions([]);
    setCurrentIndex(0);
    setError(null);
  }, []);

  if (phase === "loading") {
    return (
      <div className="loading-screen">
        <div className="dots-loader">
          <span />
          <span />
          <span />
        </div>
        <p className="loading-text">Loading questions…</p>
      </div>
    );
  }

  if (phase === "categories") {
    return (
      <CategoryPicker
        allQuestions={allQuestions}
        players={players}
        onConfirm={handleConfirmCategories}
        onBack={handleRestart}
      />
    );
  }

  if (phase === "playing") {
    return (
      <GameCard
        key={currentIndex}
        question={questions[currentIndex]}
        players={players}
        currentIndex={currentIndex}
        total={questions.length}
        onNext={handleNext}
      />
    );
  }

  if (phase === "finished") {
    return <FinishScreen onRestart={handleRestart} />;
  }

  return <Setup onStart={handleStart} error={error} />;
}
