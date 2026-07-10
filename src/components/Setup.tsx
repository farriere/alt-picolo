import { useState } from "react";
import {
  DEFAULT_SHEET_ID,
  LS_SHEET_KEY,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "../config";
import { extractSheetId } from "../utils/sheets";

interface SetupProps {
  onStart: (players: string[], sheetId: string) => void;
  error: string | null;
}

export default function Setup({ onStart, error }: SetupProps) {
  const [sheetInput, setSheetInput] = useState(
    () => localStorage.getItem(LS_SHEET_KEY) || DEFAULT_SHEET_ID,
  );
  const [players, setPlayers] = useState<string[]>(["", ""]);

  const setPlayer = (index: number, value: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const addPlayer = () => {
    if (players.length < MAX_PLAYERS) setPlayers((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (players.length > MIN_PLAYERS)
      setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const filledPlayers = players.map((p) => p.trim()).filter(Boolean);
  const canStart =
    filledPlayers.length >= MIN_PLAYERS && sheetInput.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    const id = extractSheetId(sheetInput);
    localStorage.setItem(LS_SHEET_KEY, id);
    onStart(filledPlayers, id);
  };

  return (
    <div className="setup-screen">
      <header className="setup-header">
        <h1 className="setup-title">Katy's Midlife Crisis</h1>
        <p className="setup-subtitle">The drinking game</p>
      </header>

      <section className="setup-section">
        <label className="field-label">Google Sheet URL or ID</label>
        <input
          className="text-input"
          type="text"
          placeholder="Paste your Google Sheet URL…"
          value={sheetInput}
          onChange={(e) => setSheetInput(e.target.value)}
          spellCheck={false}
        />
        <p className="field-hint">
          Sheet must be public · Column A: prompt · Column B: category
        </p>
      </section>

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

      {error && <p className="error-msg">{error}</p>}

      <button
        className="primary-btn"
        disabled={!canStart}
        onClick={handleStart}
      >
        Start Game
      </button>
    </div>
  );
}
