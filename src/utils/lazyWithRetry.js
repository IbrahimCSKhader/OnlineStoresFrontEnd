import { lazy } from "react";

const RETRY_PREFIX = "online-store.lazy-retry";

function isDynamicImportError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("dynamically imported module")
  );
}

export default function lazyWithRetry(importer, key) {
  return lazy(async () => {
    const storageKey = `${RETRY_PREFIX}:${key}`;
    const hasRetried =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(storageKey) === "true";

    try {
      const module = await importer();

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(storageKey);
      }

      return module;
    } catch (error) {
      if (typeof window !== "undefined" && isDynamicImportError(error) && !hasRetried) {
        window.sessionStorage.setItem(storageKey, "true");
        window.location.reload();

        return new Promise(() => {});
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(storageKey);
      }

      throw error;
    }
  });
}
