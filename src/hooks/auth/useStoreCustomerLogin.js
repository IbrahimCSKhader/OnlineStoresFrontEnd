import { useMutation, useQueryClient } from "@tanstack/react-query";
import authApi from "../../API/auth.api.js";
import storeCustomerAuthApi from "../../API/storeCustomerAuth.api.js";
import useAuthStore from "../../store/authStore.js";
import { queryKeys } from "../../utils/queryKeys.js";
import {
  logAuthFlow,
  serializeAuthFlowError,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthSession,
} from "../../utils/token.js";
import { isOwnerRole } from "../../utils/roles.js";
import {
  applyStoreScopeToUser,
  assertStoreScopedAuthResult,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeSlug(value) {
  return normalizeValue(value).toLowerCase();
}

function normalizeErrorSignal(value) {
  return normalizeSlug(value).replace(/[\s_-]+/g, " ");
}

function hasOwnerConflictSignal(error) {
  const responseData = error?.response?.data;
  const signals = [
    error?.code,
    responseData?.code,
    responseData?.errorCode,
    responseData?.error,
    responseData?.message,
    responseData?.title,
  ]
    .map(normalizeErrorSignal)
    .filter(Boolean);

  return signals.some(
    (signal) =>
      signal.includes("owner customer conflict") ||
      signal.includes("belongs to the store owner") ||
      signal.includes("store owner flow") ||
      signal.includes("storefront customer flow") ||
      signal.includes("platform owner authentication flow") ||
      (signal.includes("store owner") && signal.includes("platform")),
  );
}

function buildOwnerPlatformFallbackError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.platformOwnerFallback = true;
  return error;
}

function tagOwnerPlatformFallbackError(error) {
  if (error && typeof error === "object") {
    error.platformOwnerFallback = true;
  }

  return error;
}

function resolveOwnerStoreScope(authResult, fallback = {}) {
  return {
    storeId: normalizeValue(
      authResult?.responseStoreId ||
        authResult?.user?.storeId ||
        authResult?.user?.StoreId ||
        authResult?.user?.store?.id ||
        fallback.storeId,
    ),
    storeSlug: normalizeSlug(
      authResult?.responseStoreSlug ||
        authResult?.user?.storeSlug ||
        authResult?.user?.StoreSlug ||
        authResult?.user?.store?.slug ||
        fallback.storeSlug,
    ),
    storeName: normalizeValue(
      authResult?.responseStoreName ||
        authResult?.user?.storeName ||
        authResult?.user?.StoreName ||
        authResult?.user?.store?.name ||
        fallback.storeName,
    ),
  };
}

function doesOwnerMatchRequestedStore(ownerStoreScope, requestedStoreScope) {
  const requestedStoreId = normalizeValue(requestedStoreScope?.storeId);
  const requestedStoreSlug = normalizeSlug(requestedStoreScope?.storeSlug);

  if (!requestedStoreId && !requestedStoreSlug) {
    return true;
  }

  return (
    (requestedStoreId && ownerStoreScope.storeId === requestedStoreId) ||
    (requestedStoreSlug && ownerStoreScope.storeSlug === requestedStoreSlug)
  );
}

async function loginOwnerViaPlatformFallback({
  storeId = "",
  storeSlug = "",
  storeName = "",
  email = "",
  password = "",
} = {}) {
  const platformData = await authApi.login({ email, password });
  const authResult = resolveStoreScopedAuthResult(platformData, storeId);
  const ownerStoreScope = resolveOwnerStoreScope(authResult, {
    storeId,
    storeSlug,
    storeName,
  });
  const isOwnerAccount =
    authResult.isOwner || isOwnerRole(authResult.role || authResult.user?.accountType);

  if (!isOwnerAccount) {
    throw buildOwnerPlatformFallbackError(
      "OWNER_ACCOUNT_REQUIRED",
      "The authenticated account is not a store owner.",
    );
  }

  if (!ownerStoreScope.storeId && !ownerStoreScope.storeSlug) {
    throw buildOwnerPlatformFallbackError(
      "OWNER_STORE_SCOPE_UNRESOLVED",
      "The owner store scope could not be verified from the platform response.",
    );
  }

  if (
    !doesOwnerMatchRequestedStore(ownerStoreScope, {
      storeId,
      storeSlug,
    })
  ) {
    throw buildOwnerPlatformFallbackError(
      "OWNER_STORE_SCOPE_MISMATCH",
      "The authenticated owner does not belong to the current store.",
    );
  }

  return {
    ...platformData,
    storeId: ownerStoreScope.storeId || normalizeValue(storeId),
    storeSlug: ownerStoreScope.storeSlug || normalizeSlug(storeSlug),
    storeName: ownerStoreScope.storeName || normalizeValue(storeName),
    dashboard:
      normalizeValue(
        platformData?.dashboard ||
          platformData?.Dashboard ||
          platformData?.data?.dashboard ||
          platformData?.data?.Dashboard,
      ) || "owner",
    sessionScope:
      normalizeValue(
        platformData?.sessionScope ||
          platformData?.SessionScope ||
          platformData?.data?.sessionScope ||
          platformData?.data?.SessionScope,
      ) || "platform",
  };
}

export default function useStoreCustomerLogin(options = {}) {
  const queryClient = useQueryClient();
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);

  function clearOwnerDashboardQueries() {
    queryClient.removeQueries({ queryKey: queryKeys.stores.all });
    queryClient.removeQueries({ queryKey: ["stores"] });
    queryClient.removeQueries({ queryKey: ["products"] });
    queryClient.removeQueries({ queryKey: ["categories"] });
    queryClient.removeQueries({ queryKey: ["sections"] });
    queryClient.removeQueries({ queryKey: ["coupons"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["reviews"] });
    queryClient.removeQueries({ queryKey: ["customer-stores"] });
  }

  return useMutation({
    mutationFn: async ({ storeId, ...payload }) => {
      logAuthFlow("Store login request", {
        requestStoreId: String(storeId || ""),
        email: String(payload?.email || "").trim(),
        hasPassword: Boolean(payload?.password),
      });

      try {
        const data = storeId
          ? await storeCustomerAuthApi.loginByStore(storeId, payload)
          : await storeCustomerAuthApi.login(payload);

        if (storeId) {
          assertStoreScopedAuthResult(resolveStoreScopedAuthResult(data, storeId));
        }

        return data;
      } catch (error) {
        if (storeId && hasOwnerConflictSignal(error)) {
          logAuthFlow("Store login detected owner conflict, retrying platform auth", {
            requestStoreId: String(storeId || ""),
            requestStoreSlug: String(payload?.storeSlug || ""),
            email: String(payload?.email || "").trim(),
          });

          try {
            const platformOwnerData = await loginOwnerViaPlatformFallback({
              storeId,
              storeSlug: payload?.storeSlug,
              storeName: payload?.storeName,
              email: String(payload?.email || "").trim(),
              password: String(payload?.password || ""),
            });
            const ownerAuthResult = resolveStoreScopedAuthResult(
              platformOwnerData,
              storeId,
            );

            assertStoreScopedAuthResult(ownerAuthResult);
            logAuthFlow("Store login owner fallback succeeded", {
              requestStoreId: String(storeId || ""),
              responseStoreId: ownerAuthResult.responseStoreId,
              responseStoreSlug: ownerAuthResult.responseStoreSlug,
              role: ownerAuthResult.role,
              user: serializeAuthFlowUser(ownerAuthResult.user),
            });

            return platformOwnerData;
          } catch (platformOwnerError) {
            const taggedFallbackError =
              tagOwnerPlatformFallbackError(platformOwnerError);

            logAuthFlow("Store login owner fallback failed", {
              requestStoreId: String(storeId || ""),
              email: String(payload?.email || "").trim(),
              error: serializeAuthFlowError(taggedFallbackError),
            });

            throw taggedFallbackError;
          }
        }

        logAuthFlow("Store login request failed", {
          requestStoreId: String(storeId || ""),
          email: String(payload?.email || "").trim(),
          error: serializeAuthFlowError(error),
        });
        throw error;
      }
    },
    ...options,
    onSuccess: (data, variables, context) => {
      const authResult = resolveStoreScopedAuthResult(data, variables?.storeId);
      const user = applyStoreScopeToUser(authResult.user, {
        storeId: authResult.responseStoreId || variables?.storeId,
        storeSlug: variables?.storeSlug || authResult.responseStoreSlug,
        storeName: variables?.storeName || authResult.responseStoreName,
      });
      const { token, role, isOwner } = authResult;

      logAuthFlow("Store login response classified", {
        requestStoreId: String(variables?.storeId || ""),
        responseStoreId: authResult.responseStoreId,
        responseStoreCustomerId: authResult.responseStoreCustomerId,
        dashboard: authResult.dashboard,
        sessionScope: authResult.sessionScope,
        isOwner,
        isCustomer: authResult.isCustomer,
        role,
        user: serializeAuthFlowUser(user),
      });

      if (isOwner) {
        clearOwnerDashboardQueries();

        if (token) {
          setPlatformAuthToken(token);
        }

        if (user) {
          setStoredPlatformUser(user);
        }

        if (role) {
          setStoredPlatformRole(role);
        }

        if (token || user || role) {
          setPlatformSession({ token, user, role });
        }

        options.onSuccess?.(data, variables, context);
        return;
      }

      const storefrontScope = {
        storeId: authResult.responseStoreId || variables?.storeId || user?.storeId,
        storeSlug:
          variables?.storeSlug || authResult.responseStoreSlug || user?.storeSlug,
      };

      if (token || user || role) {
        setStorefrontAuthSession(storefrontScope, { token, user, role });
        setStorefrontSession({ token, user, role, ...storefrontScope });
      }

      options.onSuccess?.(data, variables, context);
    },
  });
}
