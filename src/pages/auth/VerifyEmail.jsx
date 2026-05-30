import { useMemo, useState } from "react";
import {
  Link as RouterLink,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import useVerifyEmail from "../../hooks/auth/useVerifyEmail.js";
import useResendVerificationCode from "../../hooks/auth/useResendVerificationCode.js";
import useStoreCustomerVerifyEmail from "../../hooks/auth/useStoreCustomerVerifyEmail.js";
import useStoreCustomerResendVerificationCode from "../../hooks/auth/useStoreCustomerResendVerificationCode.js";
import useAuth from "../../hooks/auth/useAuth.js";
import useMergeGuestCart from "../../hooks/cart/useMergeGuestCart.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import {
  logAuthFlow,
  serializeAuthFlowError,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  setPendingVerificationEmail,
} from "../../utils/pendingVerificationEmail.js";
import { getLandingPath } from "../../utils/roles.js";
import { isOwnerSessionScopedToStore } from "../../utils/storeOwnerScope.js";
import {
  applyStoreScopeToUser,
  assertStoreScopedAuthResult,
  buildStoreCustomerAuthState,
  getStoreCustomerRedirectPath,
  hasStoreCustomerAuthContext,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";
import {
  buildStorefrontPath,
  getCurrentCustomDomainHost,
} from "../../utils/customDomain.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthSession,
} from "../../utils/token.js";
import "./Login.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: routeStoreSlug = "" } = useParams();
  const {
    isPlatformAuthenticated,
    isPlatformUser,
    platformRole,
    platformUser,
    role,
    storeCustomer,
  } = useAuth();
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);
  const setStorefrontSession = useAuthStore((state) => state.setStorefrontSession);
  const mergeGuestCart = useMergeGuestCart();
  const customDomainHost = getCurrentCustomDomainHost();
  const routeStoreQuery = useStoreBySlug(routeStoreSlug, {
    enabled: Boolean(routeStoreSlug || customDomainHost),
    staleTime: 60000,
  });
  const routeStore = useMemo(
    () => normalizeEntityResponse(routeStoreQuery.data),
    [routeStoreQuery.data],
  );
  const resolvedRouteStoreSlug = routeStoreSlug || routeStore?.slug || "";
  const stateStoreCustomerAuth = hasStoreCustomerAuthContext(location.state)
    ? location.state
    : null;
  const routeStoreCustomerAuthState = resolvedRouteStoreSlug || routeStore?.id
    ? buildStoreCustomerAuthState({
        storeId: routeStore?.id || location.state?.storeId || "",
        storeSlug: resolvedRouteStoreSlug,
        storeName: routeStore?.name || location.state?.storeName || resolvedRouteStoreSlug,
        redirectTo:
          location.state?.redirectTo ||
          buildStorefrontPath(resolvedRouteStoreSlug),
      })
    : null;
  const storeCustomerAuthState = routeStoreCustomerAuthState || stateStoreCustomerAuth;
  const isStoreCustomerMode =
    Boolean(resolvedRouteStoreSlug || routeStore?.id) || Boolean(stateStoreCustomerAuth);
  const storefrontSession = useStorefrontSession(
    storeCustomerAuthState?.storeId,
    storeCustomerAuthState?.storeSlug || resolvedRouteStoreSlug,
  );
  const redirectTo = isStoreCustomerMode
    ? getStoreCustomerRedirectPath(storeCustomerAuthState)
    : location.state?.redirectTo || "";
  const loginPath = isStoreCustomerMode
    ? storeCustomerAuthState?.storeSlug
      ? buildStorefrontPath(storeCustomerAuthState.storeSlug, "/login")
      : "/"
    : "/auth/login";
  const registerPath = isStoreCustomerMode
    ? storeCustomerAuthState?.storeSlug
      ? buildStorefrontPath(storeCustomerAuthState.storeSlug, "/register")
      : "/"
    : "/auth/register";

  const platformVerifyEmailMutation = useVerifyEmail();
  const platformResendVerificationCodeMutation = useResendVerificationCode();
  const storeCustomerVerifyEmailMutation = useStoreCustomerVerifyEmail();
  const storeCustomerResendVerificationCodeMutation = useStoreCustomerResendVerificationCode();
  const [localError, setLocalError] = useState("");

  const verifyEmailMutation = isStoreCustomerMode
    ? storeCustomerVerifyEmailMutation
    : platformVerifyEmailMutation;
  const resendVerificationCodeMutation = isStoreCustomerMode
    ? storeCustomerResendVerificationCodeMutation
    : platformResendVerificationCodeMutation;

  const defaultValues = useMemo(
    () => ({
      email: location.state?.email || getPendingVerificationEmail() || "",
      code: "",
    }),
    [location.state?.email],
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues });

  if (isStoreCustomerMode && (routeStoreSlug || customDomainHost) && !storeCustomerAuthState?.storeId && routeStoreQuery.isLoading) {
    return (
      <Box className="page-login">
        <Box className="page-login__shell" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <Paper className="page-login__panel page-login__panel--form" elevation={0}>
            <Typography variant="body1">جاري تجهيز بيانات التحقق...</Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  const isScopedOwnerForCurrentStore = isOwnerSessionScopedToStore({
    isPlatformAuthenticated,
    platformRole,
    platformUser,
    storeId: storeCustomerAuthState?.storeId,
    storeSlug: storeCustomerAuthState?.storeSlug || resolvedRouteStoreSlug,
  });
  const shouldRedirectAuthenticatedUser = isStoreCustomerMode
    ? (
        (Boolean(storeCustomer) && storefrontSession.hasScopedStorefrontSession) ||
        isScopedOwnerForCurrentStore
      )
    : isPlatformUser;
  const authenticatedRedirectTarget = isStoreCustomerMode
    ? isScopedOwnerForCurrentStore
      ? "/owner"
      : redirectTo || getLandingPath(role)
    : redirectTo || getLandingPath(role);

  if (shouldRedirectAuthenticatedUser) {
    return <Navigate to={authenticatedRedirectTarget} replace />;
  }

  function resolveCurrentStoreAuthResult(data) {
    return assertStoreScopedAuthResult(
      resolveStoreScopedAuthResult(data, storeCustomerAuthState?.storeId),
    );
  }

  function persistPlatformSession({ token, user, role: resolvedRole }) {
    if (token) {
      setPlatformAuthToken(token);
    }

    if (user) {
      setStoredPlatformUser(user);
    }

    if (resolvedRole) {
      setStoredPlatformRole(resolvedRole);
    }

    if (token || user || resolvedRole) {
      setPlatformSession({ token, user, role: resolvedRole });
    }
  }

  function persistStorefrontSession({ token, user, role: resolvedRole }) {
    const scopedUser = applyStoreScopeToUser(user, {
      storeId: storeCustomerAuthState?.storeId,
      storeSlug: storeCustomerAuthState?.storeSlug || resolvedRouteStoreSlug,
      storeName: storeCustomerAuthState?.storeName || routeStore?.name,
    });
    const storefrontScope = {
      storeId: storeCustomerAuthState?.storeId || scopedUser?.storeId,
      storeSlug:
        storeCustomerAuthState?.storeSlug || resolvedRouteStoreSlug || scopedUser?.storeSlug,
    };

    if (token || scopedUser || resolvedRole) {
      setStorefrontAuthSession(storefrontScope, {
        token,
        user: scopedUser,
        role: resolvedRole,
      });
      setStorefrontSession({
        token,
        user: scopedUser,
        role: resolvedRole,
        ...storefrontScope,
      });
    }
  }

  function handleStoreScopedAuthError(error) {
    if (error?.code === "STORE_SCOPE_MISMATCH") {
      setLocalError(
        "انتهت صلاحية سياق المتجر الحالي. أعد فتح المتجر الصحيح ثم حاول مرة أخرى.",
      );
      return true;
    }

    if (error?.code === "STORE_SCOPE_UNRESOLVED") {
      setLocalError(
        "تعذر تأكيد انتماء هذا الحساب للمتجر الحالي. حاول مرة أخرى.",
      );
      return true;
    }

    if (error?.code === "STORE_MEMBERSHIP_REQUIRED") {
      setLocalError(
        "هذا الحساب ليس مالكًا لهذا المتجر ولا زبونًا مسجلًا فيه.",
      );
      return true;
    }

    return false;
  }

  const onSubmit = handleSubmit(async (values) => {
    setLocalError("");

    const email = values.email.trim();
    const code = values.code.trim();
    logAuthFlow("Standalone verify-email submit", {
      authMode: isStoreCustomerMode ? "store" : "platform",
      email,
      codeLength: code.length,
      requestStoreId: storeCustomerAuthState?.storeId || "",
      storeSlug: storeCustomerAuthState?.storeSlug || resolvedRouteStoreSlug || "",
      redirectTo,
    });

    if (!email) {
      setLocalError("أدخل البريد الإلكتروني أولًا.");
      return;
    }

    if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
      setLocalError("تعذر تحديد المتجر المرتبط بعملية التحقق.");
      return;
    }

    setPendingVerificationEmail(email);

    try {
      const payload = isStoreCustomerMode
        ? {
            storeId: storeCustomerAuthState.storeId,
            email,
            code,
          }
        : {
            email,
            code,
          };

      const data = await verifyEmailMutation.mutateAsync(payload);

      if (isStoreCustomerMode) {
        const authResult = resolveCurrentStoreAuthResult(data);

        if (authResult.isOwner) {
          logAuthFlow("Standalone verify-email resolved owner session", {
            storeId: authResult.responseStoreId,
            role: authResult.role,
            user: serializeAuthFlowUser(authResult.user),
            targetPath: "/owner",
          });
          persistPlatformSession(authResult);
          clearPendingVerificationEmail();
          navigate("/owner", {
            replace: true,
            state: {
              storeId: storeCustomerAuthState.storeId,
              storeSlug: storeCustomerAuthState.storeSlug,
              fromStoreLogin: true,
            },
          });
          return;
        }

        logAuthFlow("Standalone verify-email resolved storefront session", {
          storeId: authResult.responseStoreId,
          storeCustomerId: authResult.responseStoreCustomerId,
          role: authResult.role,
          user: serializeAuthFlowUser(authResult.user),
          targetPath: redirectTo,
        });
        persistStorefrontSession(authResult);
        clearPendingVerificationEmail();
        await mergeGuestCart();
        navigate(redirectTo, { replace: true });
        return;
      }

      const token = extractToken(data);
      const user = extractUser(data, token);
      const resolvedRole = extractRole(data, token, user);
      logAuthFlow("Standalone verify-email resolved platform session", {
        role: resolvedRole,
        user: serializeAuthFlowUser(user),
        targetPath: redirectTo || getLandingPath(resolvedRole),
      });

      persistPlatformSession({ token, user, role: resolvedRole });
      clearPendingVerificationEmail();
      await mergeGuestCart();
      navigate(redirectTo || getLandingPath(resolvedRole), { replace: true });
    } catch (error) {
      logAuthFlow("Standalone verify-email failed", {
        authMode: isStoreCustomerMode ? "store" : "platform",
        email,
        requestStoreId: storeCustomerAuthState?.storeId || "",
        error: serializeAuthFlowError(error),
      });
      if (isStoreCustomerMode && handleStoreScopedAuthError(error)) {
        return;
      }

      setLocalError(extractApiError(error, "تعذر التحقق من البريد."));
    }
  });

  const onResendCode = async () => {
    setLocalError("");
    const email = getValues("email")?.trim();

    if (!email) {
      resendVerificationCodeMutation.reset();
      setLocalError("أدخل البريد الإلكتروني أولًا.");
      return;
    }

    if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
      resendVerificationCodeMutation.reset();
      setLocalError("تعذر تحديد المتجر المرتبط بعملية التحقق.");
      return;
    }

    setPendingVerificationEmail(email);

    const payload = isStoreCustomerMode
      ? {
          storeId: storeCustomerAuthState.storeId,
          email,
        }
      : {
          email,
        };

    await resendVerificationCodeMutation.mutateAsync(payload);
  };

  const description = isStoreCustomerMode
    ? location.state?.message ||
      "أدخل الكود الذي وصلك على البريد الإلكتروني لتفعيل حسابك داخل هذا المتجر."
    : location.state?.message || "أدخل الكود الذي وصلك على البريد الإلكتروني.";

  return (
    <Box className="page-login">
      <Box className="page-login__shell" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <Paper className="page-login__panel page-login__panel--form" elevation={0}>
          <Stack spacing={2.25} component="form" onSubmit={onSubmit}>
            <Box>
              <Typography variant="overline" className="page-login__eyebrow">
                تحقق البريد
              </Typography>
              <Typography variant="h4" className="page-login__form-title">
                أدخل كود التحقق لإكمال العملية
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>

            {verifyEmailMutation.isError ? (
              <Alert severity="error">
                {extractApiError(verifyEmailMutation.error, "تعذر التحقق من البريد.")}
              </Alert>
            ) : null}

            {localError ? <Alert severity="error">{localError}</Alert> : null}

            {location.state?.storeLink ? (
              <Alert severity="success">
                <Stack spacing={0.5}>
                  <span>
                    {location.state?.storeName
                      ? `رابط متجر ${location.state.storeName}`
                      : "رابط المتجر"}
                  </span>
                  <Button
                    component="a"
                    href={location.state.storeLink}
                    target="_blank"
                    rel="noreferrer"
                    variant="text"
                    sx={{ alignSelf: "flex-start", px: 0 }}
                  >
                    {location.state.storeLink}
                  </Button>
                </Stack>
              </Alert>
            ) : null}

            {resendVerificationCodeMutation.isSuccess ? (
              <Alert severity="success">
                {resendVerificationCodeMutation.data?.message || "تم إرسال كود تحقق جديد."}
              </Alert>
            ) : null}

            {resendVerificationCodeMutation.isError ? (
              <Alert severity="error">
                {extractApiError(resendVerificationCodeMutation.error, "تعذر إرسال كود جديد.")}
              </Alert>
            ) : null}

            <TextField
              label="البريد الإلكتروني"
              placeholder="name@example.com"
              fullWidth
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              {...register("email", {
                required: "البريد الإلكتروني مطلوب",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "يرجى إدخال بريد إلكتروني صحيح",
                },
              })}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />

            <TextField
              label="كود التحقق"
              placeholder="123456"
              fullWidth
              autoComplete="one-time-code"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VerifiedRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              {...register("code", {
                required: "كود التحقق مطلوب",
                minLength: {
                  value: 4,
                  message: "الحد الأدنى للكود 4",
                },
                maxLength: {
                  value: 10,
                  message: "الحد الأقصى للكود 10",
                },
              })}
              error={Boolean(errors.code)}
              helperText={errors.code?.message}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={verifyEmailMutation.isPending || resendVerificationCodeMutation.isPending}
            >
              {verifyEmailMutation.isPending ? "جارٍ التحقق..." : "تأكيد الكود"}
            </Button>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                type="button"
                variant="outlined"
                onClick={onResendCode}
                disabled={verifyEmailMutation.isPending || resendVerificationCodeMutation.isPending}
              >
                {resendVerificationCodeMutation.isPending
                  ? "جارٍ الإرسال..."
                  : "إعادة إرسال الكود"}
              </Button>
              <Button component={RouterLink} to={loginPath} state={location.state} variant="text">
                رجوع لتسجيل الدخول
              </Button>
            </Stack>

            <Divider />

            <Button component={RouterLink} to={registerPath} state={location.state} variant="text">
              إنشاء حساب جديد
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
