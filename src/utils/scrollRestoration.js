import { getStorageJson, setStorageJson, storageKeys } from "./storage.js";

const MAX_SCROLL_ENTRIES = 40;
const ANCHOR_PRESERVE_WINDOW_MS = 1500;
const RESTORE_TOLERANCE_PX = 4;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function toNumber(value, fallback = 0) {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
}

function toNullableNumber(value) {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : null;
}

function toStringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScrollSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  return {
    left: toNumber(snapshot.left, 0),
    top: toNumber(snapshot.top, 0),
    updatedAt: toNumber(snapshot.updatedAt, 0),
    anchorId: toStringValue(snapshot.anchorId),
    anchorViewportOffsetTop: toNullableNumber(snapshot.anchorViewportOffsetTop),
    sectionId: toStringValue(snapshot.sectionId),
    sectionViewportOffsetTop: toNullableNumber(snapshot.sectionViewportOffsetTop),
    anchorRecordedAt: toNumber(snapshot.anchorRecordedAt, 0),
  };
}

function hasRestoreTarget(snapshot) {
  return Boolean(snapshot?.anchorId || snapshot?.sectionId);
}

function shouldPreserveRestoreTarget(snapshot, now = Date.now()) {
  return (
    hasRestoreTarget(snapshot) &&
    now - toNumber(snapshot?.anchorRecordedAt, 0) <= ANCHOR_PRESERVE_WINDOW_MS
  );
}

function removeRestoreTarget(snapshot) {
  return {
    ...(snapshot || {}),
    anchorId: "",
    anchorViewportOffsetTop: null,
    sectionId: "",
    sectionViewportOffsetTop: null,
    anchorRecordedAt: 0,
  };
}

function getDocumentScrollHeight() {
  if (!isBrowser()) {
    return 0;
  }

  return Math.max(
    document.documentElement?.scrollHeight ?? 0,
    document.body?.scrollHeight ?? 0,
  );
}

function getMaxScrollableTop() {
  return Math.max(getDocumentScrollHeight() - window.innerHeight, 0);
}

function clampScrollTop(top) {
  return Math.min(Math.max(toNumber(top, 0), 0), getMaxScrollableTop());
}

function scrollWindowTo(top, left = 0) {
  const targetTop = clampScrollTop(top);

  window.scrollTo({
    top: targetTop,
    left: toNumber(left, 0),
    behavior: "auto",
  });

  return targetTop;
}

function resolveRestoreElement(elementId) {
  if (!isBrowser() || !elementId) {
    return null;
  }

  return document.getElementById(elementId);
}

function attemptAnchorRestore(element, desiredOffsetTop, left) {
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = window.scrollY + elementRect.top;
  const targetTop = scrollWindowTo(absoluteElementTop - desiredOffsetTop, left);
  const currentOffsetTop = element.getBoundingClientRect().top;

  return {
    stable: Math.abs(currentOffsetTop - desiredOffsetTop) <= RESTORE_TOLERANCE_PX,
    targetTop,
  };
}

function attemptPositionRestore(snapshot) {
  const targetTop = scrollWindowTo(snapshot.top, snapshot.left);
  const canReachSavedPosition =
    getMaxScrollableTop() + RESTORE_TOLERANCE_PX >= toNumber(snapshot.top, 0);

  return {
    stable:
      canReachSavedPosition &&
      Math.abs(window.scrollY - targetTop) <= RESTORE_TOLERANCE_PX,
    targetTop,
  };
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

export function sanitizeScrollAnchorSegment(value, fallback = "item") {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || fallback;
}

export function buildProductScrollAnchorId({
  scope = "products",
  productId = "",
  index = 0,
} = {}) {
  const normalizedScope = sanitizeScrollAnchorSegment(scope, "products");
  const normalizedProductId = sanitizeScrollAnchorSegment(
    productId,
    `item-${toNumber(index, 0)}`,
  );

  return `product-card-${normalizedScope}-${normalizedProductId}-${toNumber(index, 0)}`;
}

export function saveCurrentScrollPosition(key, snapshot = {}) {
  if (!isBrowser() || !key) {
    return null;
  }

  const positions = getScrollPositions();
  const now = Date.now();
  const existingSnapshot = normalizeScrollSnapshot(positions[key]);
  const nextSnapshotBase = shouldPreserveRestoreTarget(existingSnapshot, now)
    ? { ...existingSnapshot }
    : removeRestoreTarget(existingSnapshot);
  const hasIncomingRestoreTarget = Boolean(
    toStringValue(snapshot.anchorId) || toStringValue(snapshot.sectionId),
  );
  const nextPositions = pruneScrollPositions({
    ...positions,
    [key]: {
      ...nextSnapshotBase,
      left: toNumber(snapshot.left, Number(window.scrollX ?? 0) || 0),
      top: toNumber(snapshot.top, Number(window.scrollY ?? 0) || 0),
      updatedAt: now,
      ...(hasIncomingRestoreTarget
        ? {
            anchorId: toStringValue(snapshot.anchorId),
            anchorViewportOffsetTop: toNullableNumber(
              snapshot.anchorViewportOffsetTop,
            ),
            sectionId: toStringValue(snapshot.sectionId),
            sectionViewportOffsetTop: toNullableNumber(
              snapshot.sectionViewportOffsetTop,
            ),
            anchorRecordedAt: now,
          }
        : {}),
    },
  });

  saveScrollPositions(nextPositions);
  return nextPositions[key];
}

export function captureElementScrollSnapshot(
  key,
  { element, anchorId = "", sectionId = "" } = {},
) {
  if (!isBrowser() || !key || !element) {
    return null;
  }

  const anchorElement =
    typeof element.getBoundingClientRect === "function" ? element : null;
  const resolvedAnchorId = toStringValue(anchorId || anchorElement?.id);
  const resolvedSectionId = toStringValue(sectionId);
  const sectionElement = resolveRestoreElement(resolvedSectionId);

  return saveCurrentScrollPosition(key, {
    anchorId: resolvedAnchorId,
    anchorViewportOffsetTop: anchorElement?.getBoundingClientRect().top ?? null,
    sectionId: resolvedSectionId,
    sectionViewportOffsetTop:
      sectionElement?.getBoundingClientRect().top ?? null,
  });
}

export function getSavedScrollPosition(key) {
  if (!key) {
    return null;
  }

  return normalizeScrollSnapshot(getScrollPositions()[key]);
}

export function hasSavedScrollPosition(key) {
  return Boolean(getSavedScrollPosition(key));
}

export function restoreSavedScrollPosition(
  key,
  { maxWaitMs = 2600, delayMs = 90, stablePasses = 2 } = {},
) {
  if (!isBrowser() || !key) {
    return false;
  }

  const savedPosition = getSavedScrollPosition(key);

  if (!savedPosition) {
    return false;
  }

  let completed = false;
  let timeoutId = 0;
  let animationFrameId = 0;
  let stableRestorePasses = 0;
  let runScheduled = false;
  const startedAt = Date.now();

  const cleanup = () => {
    completed = true;
    runScheduled = false;

    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }

    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    window.removeEventListener("load", handleLoad);
  };

  const runRestoreAttempt = () => {
    if (completed) {
      return;
    }

    const anchorElement = resolveRestoreElement(savedPosition.anchorId);
    const sectionElement = anchorElement
      ? null
      : resolveRestoreElement(savedPosition.sectionId);
    const restoreResult =
      anchorElement && savedPosition.anchorViewportOffsetTop !== null
        ? attemptAnchorRestore(
            anchorElement,
            savedPosition.anchorViewportOffsetTop,
            savedPosition.left,
          )
        : sectionElement && savedPosition.sectionViewportOffsetTop !== null
          ? attemptAnchorRestore(
              sectionElement,
              savedPosition.sectionViewportOffsetTop,
              savedPosition.left,
            )
          : attemptPositionRestore(savedPosition);

    stableRestorePasses = restoreResult.stable ? stableRestorePasses + 1 : 0;

    if (
      stableRestorePasses >= Math.max(toNumber(stablePasses, 2), 1) ||
      Date.now() - startedAt >= Math.max(toNumber(maxWaitMs, 2600), delayMs)
    ) {
      cleanup();
      return;
    }

    scheduleRestoreAttempt(delayMs);
  };

  const scheduleRestoreAttempt = (nextDelayMs = delayMs) => {
    if (completed || runScheduled) {
      return;
    }

    runScheduled = true;
    timeoutId = window.setTimeout(() => {
      animationFrameId = window.requestAnimationFrame(() => {
        runScheduled = false;
        runRestoreAttempt();
      });
    }, Math.max(toNumber(nextDelayMs, delayMs), 0));
  };

  const handleLoad = () => {
    stableRestorePasses = 0;
    scheduleRestoreAttempt(16);
  };

  const mutationObserver =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          stableRestorePasses = 0;
          scheduleRestoreAttempt(40);
        });

  if (mutationObserver && document.body) {
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  window.addEventListener("load", handleLoad, { once: true });
  runRestoreAttempt();
  return true;
}
