/** Fisher-Yates shuffle — returns a new array, does not mutate the original. */
export function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Assigns random player names to each numeric placeholder slot ([1], [2], …)
 * in a prompt.  Each unique slot number gets a unique player where possible;
 * if there are more slots than players the list wraps around.
 *
 * Returns { text, assignedPlayers } so callers can highlight names separately.
 */
export function buildAssignments(
  prompt: string,
  players: string[],
): Map<number, string> {
  const slots = new Set<number>();
  for (const [, n] of prompt.matchAll(/\[(\d+)\]/g)) {
    slots.add(Number(n));
  }

  const sortedSlots = [...slots].sort((a, b) => a - b);
  const shuffled = shuffleArray(players);
  const assignment = new Map<number, string>();
  sortedSlots.forEach((slot, idx) => {
    assignment.set(slot, shuffled[idx % shuffled.length]);
  });
  return assignment;
}

/** Deterministic gradient pair for a category name. */
const GRADIENTS: [string, string][] = [
  ["#c62828", "#880e4f"], // deep red → dark pink
  ["#6a1b9a", "#283593"], // purple → dark blue
  ["#1b5e20", "#004d40"], // dark green → teal
  ["#e65100", "#bf360c"], // burnt orange → deep orange
  ["#006064", "#01579b"], // teal → dark blue
  ["#4a148c", "#1a237e"], // deep purple → indigo
  ["#b71c1c", "#4a148c"], // crimson → purple
  ["#1565c0", "#004d40"], // dark blue → teal
];

export function getCategoryGradient(category: string): [string, string] {
  const hash = [...category.toLowerCase()].reduce(
    (acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0,
    0,
  );
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}
