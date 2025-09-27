const STORAGE_KEY = 'cosmoscope_visited_bodies';

function readStorage() {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
  } catch (error) {
    console.warn('Failed to read visited bodies from storage', error);
  }
  return new Set();
}

function writeStorage(set) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (error) {
    console.warn('Failed to persist visited bodies', error);
  }
}

export function getVisitedBodies() {
  return readStorage();
}

export function markBodyVisited(bodyId) {
  const visited = readStorage();
  visited.add(bodyId);
  writeStorage(visited);
  return visited;
}

export function resetVisitedBodies() {
  writeStorage(new Set());
}
