import { useMemo } from "react";
import type { Question } from "../types";
import { buildAssignments, getCategoryGradient } from "../utils/gameUtils";

interface GameCardProps {
  question: Question;
  players: string[];
  currentIndex: number;
  total: number;
  onNext: () => void;
}

export default function GameCard({
  question,
  players,
  currentIndex,
  total,
  onNext,
}: GameCardProps) {
  const [colorA, colorB] = useMemo(
    () => getCategoryGradient(question.category || "default"),
    [question.category],
  );

  /** Compute player assignments once per question (useMemo caches by prompt). */
  const assignments = useMemo(
    () => buildAssignments(question.prompt, players),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question.prompt],
  );

  /** Split the prompt into text segments and player-name spans. */
  const promptNodes = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    const regex = /\[(\d+)\]/g;
    let m: RegExpExecArray | null;

    while ((m = regex.exec(question.prompt)) !== null) {
      if (m.index > lastIdx) {
        parts.push(question.prompt.slice(lastIdx, m.index));
      }
      const slot = Number(m[1]);
      const name = assignments.get(slot) ?? `Player ${slot}`;
      parts.push(
        <span key={m.index} className="player-highlight">
          {name}
        </span>,
      );
      lastIdx = m.index + m[0].length;
    }

    if (lastIdx < question.prompt.length) {
      parts.push(question.prompt.slice(lastIdx));
    }
    return parts;
  }, [question.prompt, assignments]);

  return (
    <div
      className="card-screen"
      style={{ background: `linear-gradient(145deg, ${colorA}, ${colorB})` }}
      onClick={onNext}
    >
      {/* decorative blobs */}
      <div className="card-blob card-blob--a" />
      <div className="card-blob card-blob--b" />
      <div className="card-blob card-blob--c" />

      <div className="card-inner">
        <header className="card-header">
          {question.category && (
            <span className="category-pill">{question.category}</span>
          )}
          <span className="progress-label">
            {currentIndex + 1} / {total}
          </span>
        </header>

        <main className="card-body">
          <p className="prompt">{promptNodes}</p>
        </main>

        <footer className="card-footer">
          <span className="tap-hint">Tap to continue</span>
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
