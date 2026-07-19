import { useState } from "react";
import { DEFAULT_SHEET_ID, LS_SHEET_KEY, MIN_PLAYERS } from "../config";

interface SetupProps {
  onStart: (players: string[], sheetId: string) => void;
  error: string | null;
}

export default function Setup({ onStart, error }: SetupProps) {
  const [players, setPlayers] = useState<string[]>(["", ""]);

  const setPlayer = (index: number, value: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === index ? value : p)));
  };

  const addPlayer = () => {
    setPlayers((prev) => [...prev, ""]);
  };

  const removePlayer = (index: number) => {
    if (players.length > MIN_PLAYERS)
      setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const filledPlayers = players.map((p) => p.trim()).filter(Boolean);
  const canStart = filledPlayers.length >= MIN_PLAYERS;

  const handleStart = () => {
    if (!canStart) return;
    const id = localStorage.getItem(LS_SHEET_KEY) || DEFAULT_SHEET_ID;
    onStart(filledPlayers, id);
  };

  return (
    <div className="setup-screen">
      <header className="setup-header">
        <h1 className="setup-title">Katy's Midlife Crisis</h1>
        <p className="setup-subtitle">The drinking game</p>
      </header>

      <section className="setup-section setup-section--players">
        <label className="field-label">Players ({players.length})</label>

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

        <button className="add-player-btn" onClick={addPlayer}>
          + Add player
        </button>
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
