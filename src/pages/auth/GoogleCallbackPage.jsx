import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMergeGuestCart from "../../hooks/cart/useMergeGuestCart.js";
import useAuthStore from "../../store/authStore.js";
import {
  logAuthFlow,
  serializeAuthFlowError,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import {
  extractRole,
  extractStorefrontCustomer,
  extractUser,
} from "../../utils/authSession.js";
import {
  clearPendingGoogleCallbackResult,
  getPendingGoogleCallbackResult,
  setPendingGoogleCallbackResult,
} from "../../utils/pendingGoogleCallbackResult.js";
import {
  clearPendingGoogleAuthContext,
  getPendingGoogleAuthContext,
  isStoreScopedPendingGoogleAuthContext,
} from "../../utils/pendingGoogleAuthContext.js";
import {
  clearPendingStoreGoogleAuth,
  setPendingStoreGoogleAuth,
} from "../../utils/pendingStoreGoogleAuth.js";
import {
  applyStoreScopeToUser,
  applyRequestedStoreScopeFallback,
  buildStoreCustomerAuthState,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";
import { isOwnerRole, isStoreCustomerRole } from "../../utils/roles.js";
import {
  clearPlatformAuthSession,
  getPlatformAuthToken,
  getStoredPlatformRole,
  getStoredPlatformUser,
  getStorefrontAuthSession,
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  normalizeStoreScope,
  normalizeStorefrontAuthSession,
  doesStorefrontSessionMatchScope,
  setStorefrontAuthSession,
} from "../../utils/token.js";

const DEFAULT_PLATFORM_REDIRECT_PATH = "/";
const DEFAULT_STOREFRONT_REDIRECT_PATH = "/";
const GOOGLE_FAILURE_PATH = "/auth/google/failure";

function readHashParams(hash) {
  if (!hash) return new URLSearchParams();

  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryPartIndex = normalizedHash.indexOf("?");
  const queryText =
    queryPartIndex >= 0
      ? normalizedHash.slice(queryPartIndex + 1)
      : normalizedHash;

  return new URLSearchParams(queryText);
}

function isSafeInternalRedirect(path) {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/auth/google")
  );
}

function replaceCallbackHistory(pathname) {
  window.history.replaceState(window.history.state, document.title, pathname);
}

function resolveGoogleStoreAuthResult({ data, requestedStoreId }) {
  return applyRequestedStoreScopeFallback(
    resolveStoreScopedAuthResult(data, requestedStoreId),
    requestedStoreId,
  );
}

function pickFirstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const filteredValues = value
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      if (filteredValues.length) {
        return filteredValues;
      }

      continue;
    }

    if (value !== null && value !== undefined) {
      const normalizedValue = String(value).trim();

      if (normalizedValue) {
        return normalizedValue;
      }
    }
  }

  return "";
}

function getParamValue(hashParams, searchParams, keys = []) {
  return pickFirstValue(
    ...keys.map((key) => hashParams.get(key)),
    ...keys.map((key) => searchParams.get(key)),
  );
}

function getParamArrayValue(hashParams, searchParams, keys = []) {
  const rawValue = getParamValue(hashParams, searchParams, keys);

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (!rawValue) {
    return [];
  }

  return String(rawValue)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildGoogleCallbackAuthPayload({
  hashParams,
  searchParams,
  token,
  fallbackStoreId,
  fallbackStoreSlug,
  fallbackRedirectTo,
}) {
  const roleValues = getParamArrayValue(hashParams, searchParams, [
    "roles",
    "role",
    "Role",
  ]);
  const fallbackRole = roleValues[0] || "";

  return {
    token,
    email: getParamValue(hashParams, searchParams, ["email", "Email"]),
    firstName: getParamValue(hashParams, searchParams, [
      "firstName",
      "FirstName",
      "given_name",
      "givenName",
    ]),
    lastName: getParamValue(hashParams, searchParams, [
      "lastName",
      "LastName",
      "family_name",
      "surname",
    ]),
    storeId:
      getParamValue(hashParams, searchParams, ["storeId", "StoreId", "store_id"]) ||
      fallbackStoreId,
    storeSlug:
      getParamValue(hashParams, searchParams, ["storeSlug", "store_slug"]) ||
      fallbackStoreSlug,
    storeCustomerId: getParamValue(hashParams, searchParams, [
      "storeCustomerId",
      "StoreCustomerId",
      "store_customer_id",
      "customerStoreId",
      "CustomerStoreId",
    ]),
    accountType: getParamValue(hashParams, searchParams, [
      "accountType",
      "AccountType",
      "account_type",
    ]),
    role: fallbackRole,
    roles: roleValues,
    redirectTo:
      getParamValue(hashParams, searchParams, [
        "redirectTo",
        "redirect",
        "returnUrl",
      ]) || fallbackRedirectTo,
    authMode: getParamValue(hashParams, searchParams, [
      "authMode",
      "AuthMode",
      "auth_mode",
    ]),
    sessionScope: getParamValue(hashParams, searchParams, [
      "sessionScope",
      "SessionScope",
      "session_scope",
    ]),
    dashboard: getParamValue(hashParams, searchParams, [
      "dashboard",
      "Dashboard",
    ]),
  };
}

function resolveGoogleCallbackSessionTarget({ data, token, user, role }) {
  const storefrontIdentity =
    extractStorefrontCustomer(data || user || {}, token) ||
    extractStorefrontCustomer(user || {}, token) ||
    extractStorefrontCustomer({}, token);
  const normalizedAccountType =
    user?.accountType ||
    data?.accountType ||
    storefrontIdentity?.accountType ||
    "";
  const normalizedSessionScope = String(data?.sessionScope || "").trim().toLowerCase();
  const normalizedDashboard = String(data?.dashboard || "").trim().toLowerCase();
  const normalizedAuthMode = String(data?.authMode || "").trim().toLowerCase();
  const hasStoreCustomerRoleSignal =
    isStoreCustomerRole(role) ||
    isStoreCustomerRole(normalizedAccountType) ||
    isStoreCustomerRole(storefrontIdentity?.accountType);
  const hasStoreCustomerIdSignal = Boolean(storefrontIdentity?.storeCustomerId);
  const hasStoreIdSignal = Boolean(storefrontIdentity?.storeId);
  const hasOwnerRoleSignal =
    isOwnerRole(role) ||
    isOwnerRole(normalizedAccountType) ||
    isOwnerRole(storefrontIdentity?.accountType);

  if (
    normalizedSessionScope === "storefront" ||
    normalizedDashboard === "customer" ||
    normalizedAuthMode === "store-customer" ||
    hasStoreCustomerRoleSignal ||
    hasStoreCustomerIdSignal
  ) {
    return {
      sessionType: "storefront",
      storefrontIdentity,
      hasStoreCustomerRoleSignal,
      hasStoreCustomerIdSignal,
      hasStoreIdSignal,
      hasOwnerRoleSignal,
    };
  }

  if (
    normalizedSessionScope === "platform" ||
    normalizedDashboard === "owner" ||
    hasOwnerRoleSignal
  ) {
    return {
      sessionType: "platform",
      storefrontIdentity,
      hasStoreCustomerRoleSignal,
      hasStoreCustomerIdSignal,
      hasStoreIdSignal,
      hasOwnerRoleSignal,
    };
  }

  return {
    sessionType: "",
    storefrontIdentity,
    hasStoreCustomerRoleSignal,
    hasStoreCustomerIdSignal,
    hasStoreIdSignal,
    hasOwnerRoleSignal,
  };
}

function pickSafeRedirect(candidate, fallback) {
  return isSafeInternalRedirect(candidate) ? candidate : fallback;
}

function buildGoogleCallbackLogPayload({
  hashParams,
  searchParams,
  pendingGoogleContext,
  pendingGoogleCallbackResult,
  callbackStoreId,
  callbackStoreSlug,
  callbackStoreName,
  token,
  error,
}) {
  return {
    pathname: window.location.pathname,
    hasHashToken: Boolean(hashParams.get("token")),
    hasSearchToken: Boolean(searchParams.get("token")),
    callbackStoreId,
    callbackStoreSlug,
    callbackStoreName,
    hasError: Boolean(error),
    hasToken: Boolean(token),
    hasPendingGoogleContext: Boolean(pendingGoogleContext),
    pendingGoogleContext: pendingGoogleContext
      ? {
          authMode: pendingGoogleContext.authMode,
          storeId: pendingGoogleContext.storeId,
          storeSlug: pendingGoogleContext.storeSlug,
          storeName: pendingGoogleContext.storeName,
          redirectTo: pendingGoogleContext.redirectTo,
        }
      : null,
    pendingGoogleCallbackResult: pendingGoogleCallbackResult
      ? {
          sessionType: pendingGoogleCallbackResult.sessionType,
          redirectTo: pendingGoogleCallbackResult.redirectTo,
          storeId: pendingGoogleCallbackResult.storeId,
          storeSlug: pendingGoogleCallbackResult.storeSlug,
        }
      : null,
  };
}

function GoogleCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mergeGuestCart = useMergeGuestCart();
  const clearPlatformSession = useAuthStore((state) => state.clearPlatformSession);
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);
  const setStorefrontSession = useAuthStore(
    (state) => state.setStorefrontSession,
  );
  const hasHandledCallbackRef = useRef(false);

  useEffect(() => {
    if (hasHandledCallbackRef.current) {
      return;
    }

    hasHandledCallbackRef.current = true;

    async function handleCallback() {
      const clearPendingGoogleArtifacts = () => {
        clearPendingStoreGoogleAuth();
        clearPendingGoogleAuthContext();
        clearPendingGoogleCallbackResult();
      };

      const persistPlatformSession = ({ token, user, role }) => {
        if (token) {
          setPlatformAuthToken(token);
        }

        if (user) {
          setStoredPlatformUser(user);
        }

        if (role) {
          setStoredPlatformRole(role);
        }

        setPlatformSession({ token, user, role });
      };

      const persistStorefrontSession = ({
        token,
        user,
        role,
        storeId = "",
        storeSlug = "",
        storeName = "",
      }) => {
        const authState = useAuthStore.getState();
        const existingPlatformToken =
          authState?.platformSession?.token || getPlatformAuthToken();
        const existingPlatformUser =
          authState?.platformSession?.user || getStoredPlatformUser();
        const existingPlatformRole =
          authState?.platformSession?.role || getStoredPlatformRole();
        const existingPlatformStorefrontIdentity = extractStorefrontCustomer(
          existingPlatformUser || {},
          existingPlatformToken,
        );
        const hasConflictingPlatformStorefrontSession =
          existingPlatformToken === token ||
          isStoreCustomerRole(existingPlatformRole) ||
          isStoreCustomerRole(existingPlatformUser?.accountType) ||
          Boolean(existingPlatformStorefrontIdentity);

        if (hasConflictingPlatformStorefrontSession) {
          clearPlatformAuthSession();
          clearPlatformSession();
          logAuthFlow("Cleared conflicting platform session before storefront persist", {
            existingPlatformRole,
            existingPlatformUser: serializeAuthFlowUser(existingPlatformUser),
            hasExistingPlatformToken: Boolean(existingPlatformToken),
          });
        }

        const scopedUser = applyStoreScopeToUser(user, {
          storeId,
          storeSlug,
          storeName,
        });
        const storefrontScope = normalizeStoreScope({
          storeId: storeId || scopedUser?.storeId,
          storeSlug: storeSlug || scopedUser?.storeSlug,
        });

        setStorefrontAuthSession(storefrontScope, {
          token,
          user: scopedUser,
          role,
        });
        setStorefrontSession({
          token,
          user: scopedUser,
          role,
          ...storefrontScope,
        });
      };

      const safeMergeGuestCart = async () => {
        try {
          const mergeResult = await mergeGuestCart();
          logAuthFlow("Google callback guest cart merge completed", mergeResult);
          return mergeResult;
        } catch (error) {
          logAuthFlow("Google callback guest cart merge failed", {
            error: serializeAuthFlowError(error),
          });
          return null;
        }
      };

      const searchParams = new URLSearchParams(location.search);
      const hashParams = readHashParams(location.hash);
      const pendingGoogleContext = getPendingGoogleAuthContext();
      const pendingGoogleCallbackResult = getPendingGoogleCallbackResult();
      const callbackStoreId =
        hashParams.get("storeId") || searchParams.get("storeId") || "";
      const callbackStoreSlug =
        hashParams.get("storeSlug") || searchParams.get("storeSlug") || "";
      const callbackStoreName =
        hashParams.get("storeName") || searchParams.get("storeName") || "";
      const token = hashParams.get("token") || searchParams.get("token") || "";
      const error = hashParams.get("error") || searchParams.get("error");
      const effectiveStoreId =
        callbackStoreId ||
        pendingGoogleContext?.storeId ||
        pendingGoogleCallbackResult?.storeId ||
        "";
      const effectiveStoreSlug =
        callbackStoreSlug ||
        pendingGoogleContext?.storeSlug ||
        pendingGoogleCallbackResult?.storeSlug ||
        "";
      const effectiveStoreName =
        callbackStoreName || pendingGoogleContext?.storeName || "";
      const callbackStoreRedirect = effectiveStoreSlug
        ? `/market/${effectiveStoreSlug}`
        : "";
      const redirectCandidate =
        hashParams.get("redirectTo") ||
        hashParams.get("redirect") ||
        hashParams.get("returnUrl") ||
        searchParams.get("redirectTo") ||
        searchParams.get("redirect") ||
        searchParams.get("returnUrl") ||
        pendingGoogleCallbackResult?.redirectTo ||
        pendingGoogleContext?.redirectTo ||
        callbackStoreRedirect ||
        location.state?.redirectTo ||
        "";
      const platformRedirectPath = pickSafeRedirect(
        redirectCandidate,
        DEFAULT_PLATFORM_REDIRECT_PATH,
      );
      const storefrontRedirectPath = pickSafeRedirect(
        redirectCandidate,
        callbackStoreRedirect || DEFAULT_STOREFRONT_REDIRECT_PATH,
      );
      const callbackAuthData = buildGoogleCallbackAuthPayload({
        hashParams,
        searchParams,
        token,
        fallbackStoreId: effectiveStoreId,
        fallbackStoreSlug: effectiveStoreSlug,
        fallbackRedirectTo: storefrontRedirectPath,
      });
      const hasStoreGoogleContext =
        Boolean(callbackStoreId || callbackStoreSlug) ||
        isStoreScopedPendingGoogleAuthContext(pendingGoogleContext) ||
        Boolean(pendingGoogleCallbackResult?.storeId || pendingGoogleCallbackResult?.storeSlug);

      logAuthFlow(
        "Google callback started",
        buildGoogleCallbackLogPayload({
          hashParams,
          searchParams,
          pendingGoogleContext,
          pendingGoogleCallbackResult,
          callbackStoreId,
          callbackStoreSlug,
          callbackStoreName,
          token,
          error,
        }),
      );
      logAuthFlow("Google callback metadata payload", {
        authMode: callbackAuthData.authMode,
        sessionScope: callbackAuthData.sessionScope,
        dashboard: callbackAuthData.dashboard,
        accountType: callbackAuthData.accountType,
        role: callbackAuthData.role,
        roles: callbackAuthData.roles,
        storeId: callbackAuthData.storeId,
        storeSlug: callbackAuthData.storeSlug,
        storeCustomerId: callbackAuthData.storeCustomerId,
        redirectTo: callbackAuthData.redirectTo,
      });

      if (error) {
        logAuthFlow("Google callback returned explicit backend error", {
          error,
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
        });
        clearPendingGoogleArtifacts();
        replaceCallbackHistory(location.pathname);
        navigate(`${GOOGLE_FAILURE_PATH}?message=${encodeURIComponent(error)}`, {
          replace: true,
        });
        return;
      }

      if (!token) {
        const currentAuthState = useAuthStore.getState();
        const callbackStoreScope = normalizeStoreScope({
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
        });
        const activeStorefrontSession = normalizeStorefrontAuthSession(
          currentAuthState?.storefrontSession,
          callbackStoreScope,
        );
        const storedScopedStorefrontSession =
          getStorefrontAuthSession(callbackStoreScope) || null;
        const persistedPlatformSession = {
          token:
            currentAuthState?.platformSession?.token || getPlatformAuthToken(),
          user:
            currentAuthState?.platformSession?.user || getStoredPlatformUser(),
          role:
            currentAuthState?.platformSession?.role || getStoredPlatformRole(),
        };
        const persistedStorefrontSession = {
          token:
            (doesStorefrontSessionMatchScope(
              activeStorefrontSession,
              callbackStoreScope,
            )
              ? activeStorefrontSession.token
              : "") || storedScopedStorefrontSession?.token || "",
          user:
            (doesStorefrontSessionMatchScope(
              activeStorefrontSession,
              callbackStoreScope,
            )
              ? activeStorefrontSession.user
              : null) || storedScopedStorefrontSession?.user || null,
          role:
            (doesStorefrontSessionMatchScope(
              activeStorefrontSession,
              callbackStoreScope,
            )
              ? activeStorefrontSession.role
              : "") || storedScopedStorefrontSession?.role || "",
        };
        const persistedStorefrontUser =
          persistedStorefrontSession.user ||
          extractUser({}, persistedStorefrontSession.token);
        const persistedStorefrontRole =
          persistedStorefrontSession.role ||
          extractRole({}, persistedStorefrontSession.token, persistedStorefrontUser);
        const persistedStorefrontCustomer = extractStorefrontCustomer(
          persistedStorefrontUser,
          persistedStorefrontSession.token,
        );
        const preferredSessionType =
          pendingGoogleCallbackResult?.sessionType || "";
        const canFallbackToPlatformSession =
          !hasStoreGoogleContext || preferredSessionType === "platform";
        const persistedSession =
          preferredSessionType === "platform" && persistedPlatformSession.token
            ? {
                type: "platform",
                ...persistedPlatformSession,
              }
            : preferredSessionType === "storefront" &&
                persistedStorefrontSession.token
              ? {
                  type: "storefront",
                  ...persistedStorefrontSession,
                }
              : hasStoreGoogleContext && persistedStorefrontSession.token
                ? {
                    type: "storefront",
                    ...persistedStorefrontSession,
                  }
                : persistedStorefrontSession.token && persistedStorefrontCustomer
                  ? {
                      type: "storefront",
                      ...persistedStorefrontSession,
                    }
                  : canFallbackToPlatformSession && persistedPlatformSession.token
                    ? {
                        type: "platform",
                        ...persistedPlatformSession,
                      }
                    : !hasStoreGoogleContext && persistedStorefrontSession.token
                      ? {
                          type: "storefront",
                          ...persistedStorefrontSession,
                        }
                      : null;

        logAuthFlow("Google callback missing token, attempting rehydrate", {
          preferredSessionType,
          hasStoreGoogleContext,
          canFallbackToPlatformSession,
          hasPersistedPlatformToken: Boolean(persistedPlatformSession.token),
          hasPersistedStorefrontToken: Boolean(persistedStorefrontSession.token),
          persistedStorefrontRole,
          persistedStorefrontUser: serializeAuthFlowUser(persistedStorefrontUser),
          hasPersistedStorefrontCustomer: Boolean(persistedStorefrontCustomer),
        });

        if (preferredSessionType === "pending") {
          const fallbackPendingRedirect = pickSafeRedirect(
            pendingGoogleCallbackResult?.redirectTo,
            effectiveStoreSlug
              ? `/market/${effectiveStoreSlug}/login`
              : "/auth/login",
          );
          clearPendingGoogleCallbackResult();
          replaceCallbackHistory(location.pathname);
          navigate(fallbackPendingRedirect, { replace: true });
          return;
        }

        if (persistedSession?.token) {
          const persistedUser =
            persistedSession.user || extractUser({}, persistedSession.token);
          const persistedRole =
            persistedSession.role ||
            extractRole({}, persistedSession.token, persistedUser);
          const persistedRedirectPath =
            persistedSession.type === "storefront"
              ? pickSafeRedirect(
                  pendingGoogleCallbackResult?.redirectTo,
                  storefrontRedirectPath,
                )
              : pickSafeRedirect(
                  pendingGoogleCallbackResult?.redirectTo,
                  platformRedirectPath,
                );

          if (persistedSession.type === "platform") {
            setPlatformSession({
              token: persistedSession.token,
              user: persistedUser,
              role: persistedRole,
            });
          } else {
            const persistedStorefrontScope = normalizeStoreScope({
              storeId:
                effectiveStoreId ||
                persistedUser?.storeId ||
                storedScopedStorefrontSession?.storeId,
              storeSlug:
                effectiveStoreSlug ||
                persistedUser?.storeSlug ||
                storedScopedStorefrontSession?.storeSlug,
            });
            setStorefrontSession({
              token: persistedSession.token,
              user: persistedUser,
              role: persistedRole,
              ...persistedStorefrontScope,
            });
          }

          clearPendingGoogleCallbackResult();
          clearPendingStoreGoogleAuth();
          clearPendingGoogleAuthContext();
          replaceCallbackHistory(location.pathname);
          navigate(persistedRedirectPath, { replace: true });
          return;
        }

        clearPendingGoogleArtifacts();
        replaceCallbackHistory(location.pathname);
        navigate(`${GOOGLE_FAILURE_PATH}?message=missing_token`, {
          replace: true,
        });
        return;
      }

      const user = extractUser(callbackAuthData, token);
      const role = extractRole(callbackAuthData, token, user);

      if (!user && !role) {
        logAuthFlow("Google callback token could not be decoded", {
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
        });
        clearPendingGoogleArtifacts();
        replaceCallbackHistory(location.pathname);
        navigate(`${GOOGLE_FAILURE_PATH}?message=invalid_token`, {
          replace: true,
        });
        return;
      }

      const authResult = resolveGoogleStoreAuthResult({
        data: callbackAuthData,
        requestedStoreId: effectiveStoreId,
      });
      const tokenSessionTarget = resolveGoogleCallbackSessionTarget({
        data: callbackAuthData,
        token,
        user,
        role,
      });
      const resolvedStorefrontUser =
        authResult.isCustomer && authResult.user
          ? authResult.user
          : tokenSessionTarget.storefrontIdentity || authResult.user || user;
      const resolvedStorefrontRole =
        authResult.role ||
        role ||
        resolvedStorefrontUser?.accountType ||
        tokenSessionTarget.storefrontIdentity?.accountType ||
        "";
      const resolvedStorefrontStoreId =
        authResult.responseStoreId ||
        tokenSessionTarget.storefrontIdentity?.storeId ||
        effectiveStoreId;
      const resolvedStorefrontCustomerId =
        authResult.responseStoreCustomerId ||
        tokenSessionTarget.storefrontIdentity?.storeCustomerId ||
        resolvedStorefrontUser?.storeCustomerId ||
        "";
      const hasExplicitStoreMismatch =
        Boolean(effectiveStoreId) &&
        (
          (authResult.isCustomer &&
            Boolean(authResult.responseStoreId) &&
            !authResult.belongsToRequestedStore) ||
          (tokenSessionTarget.sessionType === "storefront" &&
            Boolean(resolvedStorefrontStoreId) &&
            resolvedStorefrontStoreId !== effectiveStoreId)
        );

      logAuthFlow("Google callback token classified", {
        effectiveStoreId,
        effectiveStoreSlug,
        hasStoreGoogleContext,
        redirectTo: storefrontRedirectPath,
        role,
        decodedUser: serializeAuthFlowUser(user),
        tokenSessionType: tokenSessionTarget.sessionType,
        tokenAccountType:
          user?.accountType || tokenSessionTarget.storefrontIdentity?.accountType || "",
        tokenStoreId: resolvedStorefrontStoreId,
        tokenStoreCustomerId: resolvedStorefrontCustomerId,
        hasStoreCustomerRoleSignal: tokenSessionTarget.hasStoreCustomerRoleSignal,
        hasStoreCustomerIdSignal: tokenSessionTarget.hasStoreCustomerIdSignal,
        hasStoreIdSignal: tokenSessionTarget.hasStoreIdSignal,
        hasOwnerRoleSignal: tokenSessionTarget.hasOwnerRoleSignal,
        responseStoreId: authResult.responseStoreId,
        responseStoreCustomerId: authResult.responseStoreCustomerId,
        isOwner: authResult.isOwner,
        isCustomer: authResult.isCustomer,
        belongsToRequestedStore: authResult.belongsToRequestedStore,
        sessionScope: authResult.sessionScope,
      });

      if (tokenSessionTarget.sessionType === "storefront") {
        if (hasExplicitStoreMismatch) {
          logAuthFlow("Google callback detected store scope mismatch", {
            requestedStoreId: effectiveStoreId,
            responseStoreId: resolvedStorefrontStoreId,
            responseStoreCustomerId: resolvedStorefrontCustomerId,
            role: resolvedStorefrontRole,
            user: serializeAuthFlowUser(resolvedStorefrontUser),
          });
          clearPendingGoogleArtifacts();
          replaceCallbackHistory(location.pathname);
          navigate(`${GOOGLE_FAILURE_PATH}?message=store_scope_mismatch`, {
            replace: true,
          });
          return;
        }

        persistStorefrontSession({
          token,
          user: resolvedStorefrontUser,
          role: resolvedStorefrontRole,
          storeId: resolvedStorefrontStoreId,
          storeSlug: effectiveStoreSlug,
          storeName: effectiveStoreName,
        });
        setPendingGoogleCallbackResult({
          sessionType: "storefront",
          redirectTo: storefrontRedirectPath,
          storeId: resolvedStorefrontStoreId,
          storeSlug: effectiveStoreSlug,
        });
        clearPendingStoreGoogleAuth();
        clearPendingGoogleAuthContext();
        await safeMergeGuestCart();
        replaceCallbackHistory(location.pathname);
        navigate(storefrontRedirectPath, { replace: true });
        return;
      }

      if (tokenSessionTarget.sessionType === "platform" || authResult.isOwner) {
        persistPlatformSession({
          token,
          user: authResult.user,
          role: authResult.role,
        });
        setPendingGoogleCallbackResult({
          sessionType: "platform",
          redirectTo: "/owner",
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
        });
        clearPendingStoreGoogleAuth();
        clearPendingGoogleAuthContext();
        replaceCallbackHistory(location.pathname);
        navigate("/owner", { replace: true });
        return;
      }

      if (authResult.isCustomer) {
        if (hasExplicitStoreMismatch) {
          logAuthFlow("Google callback detected store scope mismatch", {
            requestedStoreId: effectiveStoreId,
            responseStoreId: authResult.responseStoreId,
            responseStoreCustomerId: authResult.responseStoreCustomerId,
            role: authResult.role,
            user: serializeAuthFlowUser(authResult.user),
          });
          clearPendingGoogleArtifacts();
          replaceCallbackHistory(location.pathname);
          navigate(`${GOOGLE_FAILURE_PATH}?message=store_scope_mismatch`, {
            replace: true,
          });
          return;
        }

        persistStorefrontSession({
          token,
          user: authResult.user,
          role: authResult.role,
          storeId: authResult.responseStoreId || effectiveStoreId,
          storeSlug: effectiveStoreSlug,
          storeName: effectiveStoreName,
        });
        setPendingGoogleCallbackResult({
          sessionType: "storefront",
          redirectTo: storefrontRedirectPath,
          storeId: authResult.responseStoreId || effectiveStoreId,
          storeSlug: effectiveStoreSlug,
        });
        clearPendingStoreGoogleAuth();
        clearPendingGoogleAuthContext();
        await safeMergeGuestCart();
        replaceCallbackHistory(location.pathname);
        navigate(storefrontRedirectPath, { replace: true });
        return;
      }

      if (hasStoreGoogleContext) {
        const storeAuthState = buildStoreCustomerAuthState({
          storeId: effectiveStoreId,
          storeSlug: effectiveStoreSlug,
          storeName: effectiveStoreName,
          redirectTo: storefrontRedirectPath,
        });
        const storeLoginPath = storeAuthState.storeSlug
          ? `/market/${storeAuthState.storeSlug}/login`
          : "/auth/login";

        setPendingStoreGoogleAuth({
          appUserToken: token,
          email: user?.email || "",
          storeId: storeAuthState.storeId,
          storeSlug: storeAuthState.storeSlug,
          storeName: storeAuthState.storeName,
          redirectTo: storeAuthState.redirectTo,
        });
        setPendingGoogleCallbackResult({
          sessionType: "pending",
          redirectTo: storeLoginPath,
          storeId: storeAuthState.storeId,
          storeSlug: storeAuthState.storeSlug,
        });
        clearPendingGoogleAuthContext();

        logAuthFlow("Google callback requires pending store setup", {
          storeId: storeAuthState.storeId,
          storeSlug: storeAuthState.storeSlug,
          redirectTo: storeAuthState.redirectTo,
          role,
          user: serializeAuthFlowUser(user),
        });

        replaceCallbackHistory(location.pathname);
        navigate(storeLoginPath, {
          replace: true,
          state: {
            ...storeAuthState,
            googleStoreAuthPending: true,
          },
        });
        return;
      }

      logAuthFlow("Google callback classification was impossible", {
        role,
        user: serializeAuthFlowUser(user),
        effectiveStoreId,
        effectiveStoreSlug,
      });
      clearPendingGoogleArtifacts();
      replaceCallbackHistory(location.pathname);
      navigate(`${GOOGLE_FAILURE_PATH}?message=classification_impossible`, {
        replace: true,
      });
    }

    void handleCallback().catch((error) => {
      logAuthFlow("Google callback processing failed", {
        error: serializeAuthFlowError(error),
      });
      clearPendingStoreGoogleAuth();
      clearPendingGoogleAuthContext();
      clearPendingGoogleCallbackResult();
      replaceCallbackHistory(location.pathname);
      navigate(`${GOOGLE_FAILURE_PATH}?message=processing_failed`, {
        replace: true,
      });
    });
  }, [
    clearPlatformSession,
    location.hash,
    location.pathname,
    location.search,
    location.state,
    mergeGuestCart,
    navigate,
    setPlatformSession,
    setStorefrontSession,
  ]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
      }}
    >
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          جارٍ إكمال تسجيل الدخول عبر Google...
        </Typography>
      </Stack>
    </Box>
  );
}

export default GoogleCallbackPage;
