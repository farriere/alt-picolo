import { useMemo, useState } from "react";
import {
  DEFAULT_SHEET_ID,
  LS_SHEET_KEY,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "../config";
import type { Question } from "../types";
import { getCategoryGradient } from "../utils/gameUtils";
import { extractSheetId, fetchQuestionsFromSheet } from "../utils/sheets";

interface SetupProps {
  onStart: (players: string[], filteredQuestions: Question[]) => void;
}

type LoadPhase = "idle" | "fetching" | "ready" | "error";

export default function Setup({ onStart }: SetupProps) {
  // ── player state ────────────────────────────────────────────
  const [sheetInput, setSheetInput] = useState(
    () => localStorage.getItem(LS_SHEET_KEY) || DEFAULT_SHEET_ID,
  );
  const [players, setPlayers] = useState<string[]>(["", ""]);

  const setPlayer = (index: number, value: string) =>
    setPlayers((prev) => prev.map((p, i) => (i === index ? value : p)));
  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) setPlayers((prev) => [...prev, ""]);
  };
  const removePlayer = (index: number) => {
    if (players.length > MIN_PLAYERS)
      setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const filledPlayers = players.map((p) => p.trim()).filter(Boolean);

  // ── load state ──────────────────────────────────────────────
  const [loadPhase, setLoadPhase] = useState<LoadPhase>("idle");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Reset when sheet URL is edited so user can re-load.
  const handleSheetChange = (val: string) => {
    setSheetInput(val);
    if (loadPhase !== "idle") {
      setLoadPhase("idle");
      setAllQuestions([]);
      setFetchError(null);
    }
  };

  const handleLoad = async () => {
    setLoadPhase("fetching");
    setFetchError(null);
    try {
      const id = extractSheetId(sheetInput);
      localStorage.setItem(LS_SHEET_KEY, id);
      const questions = await fetchQuestionsFromSheet(id);
      setAllQuestions(questions);
      // Select all categories by default.
      setSelected(
        new Set(questions.map((q) => q.category.trim() || "Uncategorized")),
      );
      setLoadPhase("ready");
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load questions.",
      );
      setLoadPhase("error");
    }
  };

  // ── category state ──────────────────────────────────────────
  const categoryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of allQuestions) {
      const cat = q.category.trim() || "Uncategorized";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return map;
  }, [allQuestions]);

  const toggle = (cat: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });

  const filteredCount = useMemo(
    () =>
      allQuestions.filter((q) =>
        selected.has(q.category.trim() || "Uncategorized"),
      ).length,
    [allQuestions, selected],
  );

  // ── actions ─────────────────────────────────────────────────
  const handlePlay = () => {
    const filtered = allQuestions.filter((q) =>
      selected.has(q.category.trim() || "Uncategorized"),
    );
    onStart(filledPlayers, filtered);
  };

  const canLoad =
    filledPlayers.length >= MIN_PLAYERS && sheetInput.trim().length > 0;

  return (
    <div className="setup-screen">
      <header className="setup-header">
        <h1 className="setup-title">Katy's Midlife Crisis</h1>
        <p className="setup-subtitle">The drinking game</p>
      </header>

      {/* Sheet URL */}
      <section className="setup-section">
        <label className="field-label">Google Sheet URL or ID</label>
        <input
          className="text-input"
          type="text"
          placeholder="Paste your Google Sheet URL…"
          value={sheetInput}
          onChange={(e) => handleSheetChange(e.target.value)}
          spellCheck={false}
        />
        <p className="field-hint">
          Sheet must be public · Column A: prompt · Column B: category
        </p>
      </section>

      {/* Players */}
      <section className="setup-section setup-section--players">
        <label className="field-label">
          Players ({players.length}/{MAX_PLAYERS})
        </label>

        {players.map((name, idx) => (
          <div key={idx} className="player-row">
            <span className="player-num">{idx + 1}</span>
            <input
              className="text-input player-input"
              type="text"
              placeholder={`Player ${idx + 1}`}
              value={name}
              maxLength={20}
              onChange={(e) => setPlayer(idx, e.target.value)}
            />
            {players.length > MIN_PLAYERS && (
              <button
                className="icon-btn remove-btn"
                onClick={() => removePlayer(idx)}
                aria-label="Remove player"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {players.length < MAX_PLAYERS && (
          <button className="add-player-btn" onClick={addPlayer}>
            + Add player
          </button>
        )}
      </section>

      {/* Categories — appear after questions load */}
      {loadPhase === "ready" && (
        <section className="setup-section setup-categories">
          <div className="setup-categories-header">
            <span className="field-label" style={{ margin: 0 }}>
              Categories
            </span>
            <span className="picker-divider" aria-hidden="true">·</span>
            <button
              className="text-btn"
              onClick={() => setSelected(new Set(categoryMap.keys()))}
            >
              All
            </button>
            <button
              className="text-btn"
              onClick={() => setSelected(new Set())}
            >
              None
            </button>
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
        </section>
      )}

      {/* Errors */}
      {fetchError && <p className="error-msg">{fetchError}</p>}

      {/* Primary CTA — morphs between Load and Play */}
      {loadPhase !== "ready" ? (
        <button
          className="primary-btn"
          disabled={!canLoad || loadPhase === "fetching"}
          onClick={handleLoad}
        >
          {loadPhase === "fetching" ? (
            <span className="btn-loading">
              <span className="btn-dots">
                <span /><span /><span />
              </span>
              Loading…
            </span>
          ) : (
            "Load Questions"
          )}
        </button>
      ) : (
        <button
          className="primary-btn"
          disabled={filteredCount === 0}
          onClick={handlePlay}
        >
          Play · {filteredCount} card{filteredCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
