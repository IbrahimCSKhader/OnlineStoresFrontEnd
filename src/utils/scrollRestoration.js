import { getStorageJson, setStorageJson, storageKeys } from "./storage.js";

const MAX_SCROLL_ENTRIES = 40;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getScrollPositions() {
  const positions = getStorageJson(storageKeys.storefrontScrollPositions, {});
  return positions && typeof positions === "object" ? positions : {};
}

function saveScrollPositions(positions) {
  setStorageJson(storageKeys.storefrontScrollPositions, positions);
}

function pruneScrollPositions(positions) {
  const entries = Object.entries(positions);

  if (entries.length <= MAX_SCROLL_ENTRIES) {
    return positions;
  }

  return Object.fromEntries(
    entries
      .sort(
        (left, right) =>
          Number(right[1]?.updatedAt ?? 0) - Number(left[1]?.updatedAt ?? 0),
      )
      .slice(0, MAX_SCROLL_ENTRIES),
  );
}

export function buildScrollRestoreKey(pathname = "", search = "") {
  return `${String(pathname || "")}${String(search || "")}` || "/";
}

export function saveCurrentScrollPosition(key) {
  if (!isBrowser() || !key) {
    return;
  }

  const positions = getScrollPositions();
  const nextPositions = pruneScrollPositions({
    ...positions,
    [key]: {
      left: Number(window.scrollX ?? 0) || 0,
      top: Number(window.scrollY ?? 0) || 0,
      updatedAt: Date.now(),
    },
  });

  saveScrollPositions(nextPositions);
}

export function getSavedScrollPosition(key) {
  if (!key) {
    return null;
  }

  const position = getScrollPositions()[key];

  if (!position || typeof position !== "object") {
    return null;
  }

  return {
    left: Number(position.left ?? 0) || 0,
    top: Number(position.top ?? 0) || 0,
  };
}

export function restoreSavedScrollPosition(
  key,
  { maxAttempts = 12, delayMs = 80 } = {},
) {
  if (!isBrowser() || !key) {
    return false;
  }

  const savedPosition = getSavedScrollPosition(key);

  if (!savedPosition) {
    return false;
  }

  let attempt = 0;

  const restore = () => {
    const root = document.documentElement;
    const maxTop = Math.max((root?.scrollHeight ?? 0) - window.innerHeight, 0);
    const targetTop = Math.min(savedPosition.top, maxTop);

    window.scrollTo({
      top: targetTop,
      left: savedPosition.left,
      behavior: "auto",
    });

    attempt += 1;

    const reachedTarget = Math.abs(window.scrollY - targetTop) <= 2;
    const reachedSavedPosition = maxTop >= savedPosition.top && reachedTarget;

    if (reachedSavedPosition || attempt >= maxAttempts) {
      return;
    }

    window.setTimeout(restore, delayMs);
  };

  restore();
  return true;
}
