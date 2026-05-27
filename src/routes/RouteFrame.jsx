import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Outlet,
  matchPath,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import {
  buildScrollRestoreKey,
  restoreSavedScrollPosition,
  saveCurrentScrollPosition,
} from "../utils/scrollRestoration.js";
import { isCustomDomainStorefront } from "../utils/customDomain.js";

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

function isProductCatalogRoute(pathname = "") {
  return Boolean(
    matchPath("/market/:slug", pathname) ||
      matchPath("/market/:slug/category/:categoryId", pathname) ||
      (isCustomDomainStorefront() &&
        (pathname === "/" || matchPath("/category/:categoryId", pathname))),
  );
}

export default function RouteFrame() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);
  const previousScrollRestoreKeyRef = useRef("");
  const previousPathnameRef = useRef("");
  const scrollRestoreKey = buildScrollRestoreKey(
    location.pathname,
    location.search,
  );
  const isProductCatalogPage = isProductCatalogRoute(location.pathname);

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

  useLayoutEffect(() => {
    const previousScrollRestoreKey = previousScrollRestoreKeyRef.current;
    const previousPathname = previousPathnameRef.current;

    if (
      previousScrollRestoreKey &&
      previousScrollRestoreKey !== scrollRestoreKey &&
      isProductCatalogRoute(previousPathname)
    ) {
      saveCurrentScrollPosition(previousScrollRestoreKey);
    }

    previousScrollRestoreKeyRef.current = scrollRestoreKey;
    previousPathnameRef.current = location.pathname;
  }, [location.pathname, scrollRestoreKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !isProductCatalogPage) {
      return undefined;
    }

    const handlePageHide = () => {
      saveCurrentScrollPosition(scrollRestoreKey);
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isProductCatalogPage, scrollRestoreKey]);

  useLayoutEffect(() => {
    const isInitialRender = isFirstRender.current;
    isFirstRender.current = false;
    const explicitRestoreRequested =
      isProductCatalogPage && Boolean(location.state?.restoreScroll);
    const requestedRestoreKey =
      explicitRestoreRequested &&
      typeof location.state?.scrollRestoreKey === "string" &&
      location.state.scrollRestoreKey
        ? location.state.scrollRestoreKey
        : scrollRestoreKey;
    const shouldRestore =
      explicitRestoreRequested ||
      (!isInitialRender && isProductCatalogPage && navigationType === "POP");

    if (shouldRestore && restoreSavedScrollPosition(requestedRestoreKey)) {
      return;
    }

    scrollToPageTop();
  }, [
    isProductCatalogPage,
    location.pathname,
    location.search,
    location.state,
    navigationType,
    scrollRestoreKey,
  ]);

  return <Outlet />;
}
