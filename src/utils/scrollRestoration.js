import { matchPath } from "react-router-dom";
import { isCustomDomainStorefront } from "./customDomain.js";
import { getStorageJson, setStorageJson, storageKeys } from "./storage.js";

const MAX_SCROLL_ENTRIES = 40;
const ANCHOR_PRESERVE_WINDOW_MS = 1500;
const RESTORE_TOLERANCE_PX = 4;
const RESTORE_TIMEOUT_MS = 2600;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function toNumber(value, fallback = 0) {
  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : fallback;
}

function toNullableNumber(value) {
  if (value == null) return null;

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
    behavior: "instant",
  });

  return targetTop;
}

function resolveRestoreElement(elementId) {
  if (!isBrowser() || !elementId) {
    return null;
  }

  return document.getElementById(elementId);
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

export function isProductCatalogRoute(pathname = "") {
  return Boolean(
    matchPath("/market/:slug", pathname) ||
      matchPath("/market/:slug/products", pathname) ||
      matchPath("/market/:slug/category/:categoryId", pathname) ||
      (isCustomDomainStorefront() &&
        (pathname === "/" || pathname === "/products" || matchPath("/category/:categoryId", pathname))),
  );
}

export function getCatalogEntryKey({ pathname, search, key }) {
  return `${pathname}${search}#${key}`;
}

export function getCatalogRestoreKey(location) {
  const { restoreScroll, scrollRestoreKey } = location.state ?? {};
  return restoreScroll && typeof scrollRestoreKey === "string" && scrollRestoreKey
    ? scrollRestoreKey
    : getCatalogEntryKey(location);
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
  const hasIncomingRestoreTarget = Boolean(
    toStringValue(snapshot.anchorId) || toStringValue(snapshot.sectionId),
  );
  const left = toNumber(snapshot.left, window.scrollX);
  const top = toNumber(snapshot.top, window.scrollY);
  // Keep the exact click snapshot when the route saves its last scroll event.
  if (!hasIncomingRestoreTarget && shouldPreserveRestoreTarget(existingSnapshot, now)) {
    return existingSnapshot;
  }

  const nextPositions = pruneScrollPositions({
    ...positions,
    [key]: {
      ...removeRestoreTarget(existingSnapshot),
      left,
      top,
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

function getAnchorTop(element, offset) {
  return window.scrollY + element.getBoundingClientRect().top - offset;
}

export function restoreSavedScrollPosition(snapshot, onComplete) {
  const root = document.documentElement;
  const startedAt = performance.now();
  let frameId;
  let lastTarget;

  const cancel = () => {
    window.cancelAnimationFrame(frameId);
    delete root.dataset.restoringCatalogScroll;
  };

  const attempt = () => {
    const { anchorId, anchorViewportOffsetTop, sectionId, sectionViewportOffsetTop, left, top } = snapshot;
    const card = resolveRestoreElement(anchorId);
    const shell = anchorId ? resolveRestoreElement(`${anchorId}-shell`) : null;
    const anchor = card || shell;
    const timedOut = performance.now() - startedAt >= RESTORE_TIMEOUT_MS;
    const section = timedOut && !anchor ? resolveRestoreElement(sectionId) : null;
    let target = top;
    if (anchor && anchorViewportOffsetTop !== null) {
      target = getAnchorTop(anchor, anchorViewportOffsetTop);
    } else if (section && sectionViewportOffsetTop !== null) {
      target = getAnchorTop(section, sectionViewportOffsetTop);
    }

    const targetTop = scrollWindowTo(target, left);
    // A shell can bring the lazy card into view, but only reveal the loaded card.
    const ready = anchorId ? Boolean(card) : targetTop + RESTORE_TOLERANCE_PX >= top;
    const stable = ready && lastTarget !== undefined &&
      Math.abs(lastTarget - targetTop) <= RESTORE_TOLERANCE_PX &&
      Math.abs(window.scrollY - targetTop) <= RESTORE_TOLERANCE_PX;

    if (timedOut || stable) {
      cancel();
      onComplete();
    } else {
      lastTarget = ready ? targetTop : undefined;
      frameId = window.requestAnimationFrame(attempt);
    }
  };

  root.dataset.restoringCatalogScroll = "";
  attempt();
  return cancel;
}
