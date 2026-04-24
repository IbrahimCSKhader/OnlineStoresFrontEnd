import { useEffect, useLayoutEffect, useRef } from "react";
import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import {
  buildScrollRestoreKey,
  restoreSavedScrollPosition,
  saveCurrentScrollPosition,
} from "../utils/scrollRestoration.js";

function scrollToPageTop() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  if (document.documentElement) {
    document.documentElement.scrollTop = 0;
  }

  if (document.body) {
    document.body.scrollTop = 0;
  }
}

export default function RouteFrame() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);
  const scrollRestoreKey = buildScrollRestoreKey(
    location.pathname,
    location.search,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) {
      return undefined;
    }

    const previousValue = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousValue;
    };
  }, []);

  useEffect(
    () => () => {
      saveCurrentScrollPosition(scrollRestoreKey);
    },
    [scrollRestoreKey],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handlePageHide = () => {
      saveCurrentScrollPosition(scrollRestoreKey);
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [scrollRestoreKey]);

  useLayoutEffect(() => {
    const isInitialRender = isFirstRender.current;
    isFirstRender.current = false;
    const requestedRestoreKey =
      typeof location.state?.scrollRestoreKey === "string" &&
      location.state.scrollRestoreKey
        ? location.state.scrollRestoreKey
        : scrollRestoreKey;
    const shouldRestore =
      Boolean(location.state?.restoreScroll && requestedRestoreKey) ||
      (!isInitialRender && navigationType === "POP");

    if (shouldRestore && restoreSavedScrollPosition(requestedRestoreKey)) {
      return;
    }

    scrollToPageTop();
  }, [location.pathname, location.search, location.state, navigationType, scrollRestoreKey]);

  return <Outlet />;
}
