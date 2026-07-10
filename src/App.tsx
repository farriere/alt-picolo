import { useCallback, useState } from "react";
import type { GamePhase, Question } from "./types";
import { shuffleArray } from "./utils/gameUtils";
import Setup from "./components/Setup";
import GameCard from "./components/GameCard";
import FinishScreen from "./components/FinishScreen";
import "./App.css";

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /** Called by Setup once the user has chosen players + categories. */
  const handleStart = useCallback(
    (playerNames: string[], filteredQuestions: Question[]) => {
      setPlayers(playerNames);
      setQuestions(shuffleArray(filteredQuestions));
      setCurrentIndex(0);
      setPhase("playing");
    },
    [],
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
    setQuestions([]);
    setCurrentIndex(0);
  }, []);

  if (phase === "playing") {
    return (
      <GameCard
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

  return <Setup onStart={handleStart} />;
}
