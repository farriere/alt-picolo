import { useMemo, useState } from "react";
import type { Question } from "../types";
import { getCategoryGradient } from "../utils/gameUtils";

interface CategoryPickerProps {
  allQuestions: Question[];
  players: string[];
  onConfirm: (selected: Set<string>) => void;
  onBack: () => void;
}

export default function CategoryPicker({
  allQuestions,
  players,
  onConfirm,
  onBack,
}: CategoryPickerProps) {
  /** Unique categories → question counts, in insertion order. */
  const categoryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of allQuestions) {
      const cat = q.category.trim() || "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return map;
  }, [allQuestions]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(categoryMap.keys()),
  );

  const toggle = (cat: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredCount = useMemo(
    () =>
      allQuestions.filter((q) =>
        selected.has(q.category.trim() || "Uncategorized"),
      ).length,
    [allQuestions, selected],
  );

  const playerLabel = players.join(" · ");

  return (
    <div className="picker-screen">
      <div className="picker-orb picker-orb--a" aria-hidden="true" />
      <div className="picker-orb picker-orb--b" aria-hidden="true" />

      <div className="picker-inner">
        <header className="picker-header">
          <button className="back-btn" onClick={onBack} aria-label="Back">
            ←
          </button>
          <div className="picker-heading">
            <h2 className="picker-title">Categories</h2>
            <p className="picker-sub">{playerLabel}</p>
          </div>
        </header>

        <div className="picker-controls">
          <button
            className="text-btn"
            onClick={() => setSelected(new Set(categoryMap.keys()))}
          >
            Select all
          </button>
          <span className="picker-divider">·</span>
          <button className="text-btn" onClick={() => setSelected(new Set())}>
            Clear
          </button>
          <span className="picker-divider">·</span>
          <span className="picker-total">{allQuestions.length} total</span>
        </div>

        <div className="cat-grid">
          {[...categoryMap.entries()].map(([cat, count]) => {
            const [c1, c2] = getCategoryGradient(cat);
            const isOn = selected.has(cat);
            return (
              <button
                key={cat}
                className={`cat-tile${isOn ? " cat-tile--on" : ""}`}
                style={
                  isOn
                    ? { background: `linear-gradient(140deg, ${c1}, ${c2})` }
                    : undefined
                }
                onClick={() => toggle(cat)}
                aria-pressed={isOn}
              >
                <span className="cat-tile-name">{cat}</span>
                <span className="cat-tile-count">
                  {count} card{count !== 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <footer className="picker-footer">
        <button
          className="primary-btn"
          disabled={filteredCount === 0}
          onClick={() => onConfirm(selected)}
        >
          Play · {filteredCount} card{filteredCount !== 1 ? "s" : ""}
        </button>
      </footer>
    </div>
  );
}
