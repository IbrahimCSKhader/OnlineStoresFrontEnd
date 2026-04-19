import { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

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
    scrollToPageTop();
  }, [location.pathname, location.search]);

  return <Outlet />;
}
