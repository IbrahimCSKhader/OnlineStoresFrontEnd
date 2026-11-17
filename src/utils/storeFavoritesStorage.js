const empty = '{"guest":[],"pending":{}}';
const changeEvent = "store-favorites-changed";

export const favoritesStorageKey = (storeId) => `store-favorites:${storeId.toLowerCase()}`;

export function readFavoritesSnapshot(key) {
  try {
    return localStorage.getItem(key) || empty;
  } catch {
    return empty;
  }
}

export function parseFavoritesSnapshot(snapshot) {
  try {
    const state = JSON.parse(snapshot);
    if (Array.isArray(state?.guest) && state.pending && typeof state.pending === "object") return state;
  } catch {
    // A malformed entry can be replaced by the next valid selection.
  }
  return { guest: [], pending: {} };
}

export function updateFavoritesStorage(key, update) {
  const previous = readFavoritesSnapshot(key);
  const state = update(parseFavoritesSnapshot(previous));
  const next = JSON.stringify(state);
  if (previous !== next) {
    if (state.guest.length || Object.keys(state.pending).length) localStorage.setItem(key, next);
    else localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: key }));
  }
  return state;
}

export function subscribeToFavorites(key, onChange) {
  const handleChange = (event) => {
    if (event.detail === key || event.key === key || event.key === null) onChange();
  };
  window.addEventListener("storage", handleChange);
  window.addEventListener(changeEvent, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(changeEvent, handleChange);
  };
}
