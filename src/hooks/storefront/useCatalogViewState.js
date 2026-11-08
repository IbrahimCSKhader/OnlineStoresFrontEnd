import { useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCatalogEntryKey, getCatalogRestoreKey } from "../../utils/scrollRestoration.js";

const catalogViews = new Map();

export default function useCatalogViewState(initialView) {
  const location = useLocation();
  const key = getCatalogEntryKey(location);
  const restoreKey = getCatalogRestoreKey(location);
  const getSavedView = () => catalogViews.get(key) ?? catalogViews.get(restoreKey) ?? initialView;
  const [entry, setEntry] = useState(() => ({
    key,
    view: getSavedView(),
  }));

  if (entry.key !== key) {
    setEntry({ key, view: getSavedView() });
  }

  useLayoutEffect(() => {
    catalogViews.delete(entry.key);
    catalogViews.set(entry.key, entry.view);
    if (catalogViews.size > 40) {
      catalogViews.delete(catalogViews.keys().next().value);
    }
  }, [entry]);

  const updateView = (patch) => {
    setEntry((previous) => ({ key, view: { ...previous.view, ...patch } }));
  };

  return [entry.view, updateView];
}
