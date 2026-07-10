import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../types";
import { buildAssignments, getCategoryGradient } from "../utils/gameUtils";

interface GameCardProps {
  question: Question;
  players: string[];
  currentIndex: number;
  total: number;
  onNext: () => void;
}

type AnimPhase = "entering" | "idle" | "exiting";
const ANIM_MS = 220;

export default function GameCard({
  question,
  players,
  currentIndex,
  total,
  onNext,
}: GameCardProps) {
  /**
   * "shown" holds what's actually rendered.  It lags behind the incoming props
   * by one exit-animation duration so the old content can slide out before the
   * new content slides in — avoiding any remount or white flash.
   */
  const [shown, setShown] = useState({ question, currentIndex });
  const [phase, setPhase] = useState<AnimPhase>("entering");

  // Always keep a ref of the latest incoming props so the timeout closure
  // can read them even if props changed again during the exit animation.
  const pending = useRef({ question, currentIndex });
  useEffect(() => {
    pending.current = { question, currentIndex };
  });

  // Initial mount: slide in, then settle.
  useEffect(() => {
    const t = setTimeout(() => setPhase("idle"), ANIM_MS);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the incoming question changes, run the exit→swap→enter cycle.
  useEffect(() => {
    if (question.prompt === shown.question.prompt) return;

    setPhase("exiting");

    let enterTimer: ReturnType<typeof setTimeout>;
    const exitTimer = setTimeout(() => {
      setShown({
        question: pending.current.question,
        currentIndex: pending.current.currentIndex,
      });
      setPhase("entering");
      enterTimer = setTimeout(() => setPhase("idle"), ANIM_MS);
    }, ANIM_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(enterTimer);
    };
  }, [question.prompt]); // eslint-disable-line react-hooks/exhaustive-deps

  const { question: q, currentIndex: idx } = shown;

  const [colorA, colorB] = useMemo(
    () => getCategoryGradient(q.category || "default"),
    [q.category],
  );

  const assignments = useMemo(
    () => buildAssignments(q.prompt, players),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q.prompt],
  );

  const promptNodes = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    const regex = /\[(\d+)\]/g;
    let m: RegExpExecArray | null;

    while ((m = regex.exec(q.prompt)) !== null) {
      if (m.index > lastIdx) {
        parts.push(q.prompt.slice(lastIdx, m.index));
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

    if (lastIdx < q.prompt.length) {
      parts.push(q.prompt.slice(lastIdx));
    }
    return parts;
  }, [q.prompt, assignments]);

  return (
    <div
      className="card-screen"
      style={{ background: `linear-gradient(145deg, ${colorA}, ${colorB})` }}
      onClick={phase === "idle" ? onNext : undefined}
    >
      {/* decorative blobs */}
      <div className="card-blob card-blob--a" />
      <div className="card-blob card-blob--b" />
      <div className="card-blob card-blob--c" />

      <div className={`card-inner card-inner--${phase}`}>
        <header className="card-header">
          {q.category && <span className="category-pill">{q.category}</span>}
          <span className="progress-label">
            {idx + 1} / {total}
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
              style={{ width: `${((idx + 1) / total) * 100}%` }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
