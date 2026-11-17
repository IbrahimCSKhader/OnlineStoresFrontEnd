import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import { StoreFavoritesContext } from "../../hooks/storefront/storeFavoritesContext.js";
import favoritesApi from "../../API/storeFavorites.api.js";
import {
  favoritesStorageKey, parseFavoritesSnapshot, readFavoritesSnapshot, subscribeToFavorites, updateFavoritesStorage,
} from "../../utils/storeFavoritesStorage.js";

const mergeBatchSize = 500;

async function syncFavorites(storeId, storageKey, customerId, token, signal) {
  // Keep any unfinished import assigned to this customer if the session changes.
  const { pending } = updateFavoritesStorage(storageKey, state => {
    if (!state.guest.length) return state;
    return {
      guest: [],
      pending: {
        ...state.pending,
        [customerId]: [...new Set([...(state.pending[customerId] || []), ...state.guest])],
      },
    };
  });
  const imports = pending[customerId] || [];
  if (!imports.length) return favoritesApi.get(storeId, token, signal);

  let ids;
  for (let start = 0; start < imports.length; start += mergeBatchSize) {
    signal.throwIfAborted();
    const batch = imports.slice(start, start + mergeBatchSize);
    ids = await favoritesApi.merge(storeId, batch, token, signal);
    const imported = new Set(batch);
    updateFavoritesStorage(storageKey, state => {
      const remaining = (state.pending[customerId] || []).filter(id => !imported.has(id));
      if (remaining.length) state.pending[customerId] = remaining;
      else delete state.pending[customerId];
      return state;
    });
  }
  return ids;
}

function StoreFavoritesScope({ storeId, customerId, token, children }) {
  const queryClient = useQueryClient();
  const storageKey = favoritesStorageKey(storeId);
  const subscribe = useCallback(onChange => subscribeToFavorites(storageKey, onChange), [storageKey]);
  const read = useCallback(() => readFavoritesSnapshot(storageKey), [storageKey]);
  const snapshot = useSyncExternalStore(subscribe, read);
  const local = useMemo(() => parseFavoritesSnapshot(snapshot), [snapshot]);
  const queryKey = ["store-favorites", storeId, customerId];
  const inFlight = useRef(new Set());
  const favorites = useQuery({
    queryKey,
    enabled: Boolean(token && customerId),
    queryFn: ({ signal }) => syncFavorites(storeId, storageKey, customerId, token, signal),
  });
  const change = useMutation({
    mutationKey: [...queryKey, "toggle"],
    mutationFn: async ({ id, selected }) => {
      if (!token) {
        updateFavoritesStorage(storageKey, state => {
          state.guest = selected ? state.guest.filter(product => product !== id) : [...new Set([...state.guest, id])];
          return state;
        });
        return;
      }

      await queryClient.cancelQueries({ queryKey, exact: true });
      await (selected ? favoritesApi.remove : favoritesApi.add)(storeId, id, token);
      queryClient.setQueryData(queryKey, (ids = []) =>
        selected ? ids.filter(product => product !== id) : [...new Set([...ids, id])]);
    },
    onSettled: (_, __, variables) => { inFlight.current.delete(variables.customerId); },
  });
  const ids = useMemo(() => new Set(token
    ? [...(favorites.data || []), ...(local.pending[customerId] || []), ...local.guest]
    : local.guest), [customerId, favorites.data, local, token]);
  const loading = Boolean(token && !favorites.data && !favorites.isError);
  const canToggle = !token || (Boolean(favorites.data) && !favorites.isError && !local.pending[customerId] && !local.guest.length);
  const toggle = (id) => {
    if (!canToggle || inFlight.current.has(customerId)) return;
    inFlight.current.add(customerId);
    change.mutate({ id, selected: ids.has(id), customerId });
  };

  return (
    <StoreFavoritesContext.Provider value={{
      storeId, ids, loading, canToggle, toggle,
      busy: change.isPending, error: favorites.isError || change.isError,
      retry: favorites.isError ? favorites.refetch : null,
      mutationError: change.isError,
      dismissError: change.reset,
    }}>
      {children}
    </StoreFavoritesContext.Provider>
  );
}

export default function StoreFavoritesProvider({ storeId, storeSlug, disabled, children }) {
  const { hasScopedStorefrontSession, storefrontSession, storefrontCustomer } =
    useStorefrontSession(storeId, storeSlug);
  if (!storeId || disabled) return children;

  const token = hasScopedStorefrontSession ? storefrontSession?.token || "" : "";
  const customerId = token ? storefrontCustomer?.storeCustomerId || storefrontCustomer?.id : "";
  return (
    <StoreFavoritesScope key={storeId} storeId={storeId} customerId={customerId} token={token}>
      {children}
    </StoreFavoritesScope>
  );
}
