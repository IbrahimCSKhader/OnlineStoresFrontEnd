import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import {
  getCatalogEntryKey,
  getCatalogRestoreKey,
  getSavedScrollPosition,
  isProductCatalogRoute,
  restoreSavedScrollPosition,
  saveCurrentScrollPosition,
} from "../utils/scrollRestoration.js";

function readScrollPosition() {
  return { left: window.scrollX, top: window.scrollY };
}

export default function RouteFrame() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lastEntry = useRef(location.key);
  const hasNavigated = useRef(false);

  const entryKey = getCatalogEntryKey(location);
  const restoreKey = getCatalogRestoreKey(location);
  const isCatalog = isProductCatalogRoute(location.pathname);
  const explicitRestore = Boolean(location.state?.restoreScroll);

  useLayoutEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;

    const previousValue = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousValue;
    };
  }, []);

  useLayoutEffect(() => {
    if (lastEntry.current !== location.key) {
      lastEntry.current = location.key;
      hasNavigated.current = true;
    }

    const shouldRestore = isCatalog &&
      (explicitRestore || (hasNavigated.current && navigationType === "POP"));
    const snapshot = shouldRestore
      ? getSavedScrollPosition(entryKey) ?? getSavedScrollPosition(restoreKey)
      : null;
    let restoring = Boolean(snapshot);
    let position = readScrollPosition();

    const capturePosition = () => {
      if (!restoring) position = readScrollPosition();
    };
    const savePosition = () => {
      if (isCatalog && !restoring) saveCurrentScrollPosition(entryKey, position);
    };

    const cancelRestore = snapshot
      ? restoreSavedScrollPosition(snapshot, () => {
          restoring = false;
          capturePosition();
        })
      : null;

    if (!snapshot) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      capturePosition();
    }

    if (isCatalog) {
      window.addEventListener("scroll", capturePosition, { passive: true });
      window.addEventListener("pagehide", savePosition);
    }

    return () => {
      savePosition();
      cancelRestore?.();
      window.removeEventListener("scroll", capturePosition);
      window.removeEventListener("pagehide", savePosition);
    };
  }, [entryKey, explicitRestore, isCatalog, location.key, navigationType, restoreKey]);

  return <Outlet />;
}
