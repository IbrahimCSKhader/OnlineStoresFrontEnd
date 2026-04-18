import { useEffect, useMemo, useState } from "react";
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
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import useAuth from "../../hooks/auth/useAuth.js";
import useLogin from "../../hooks/auth/useLogin.js";
import useStoreCustomerLogin from "../../hooks/auth/useStoreCustomerLogin.js";
import useVerifyEmail from "../../hooks/auth/useVerifyEmail.js";
import useResendVerificationCode from "../../hooks/auth/useResendVerificationCode.js";
import useStoreCustomerVerifyEmail from "../../hooks/auth/useStoreCustomerVerifyEmail.js";
import useStoreCustomerResendVerificationCode from "../../hooks/auth/useStoreCustomerResendVerificationCode.js";
import useForgotPassword from "../../hooks/auth/useForgotPassword.js";
import useResetPassword from "../../hooks/auth/useResetPassword.js";
import useStoreCustomerForgotPassword from "../../hooks/auth/useStoreCustomerForgotPassword.js";
import useStoreCustomerResetPassword from "../../hooks/auth/useStoreCustomerResetPassword.js";
import useStoreCustomerSetPasswordFromAuthUser from "../../hooks/auth/useStoreCustomerSetPasswordFromAuthUser.js";
import useMergeGuestCart from "../../hooks/cart/useMergeGuestCart.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useAuthStore from "../../store/authStore.js";
import {
  extractRole,
  extractToken,
  extractUser,
} from "../../utils/authSession.js";
import {
  logAuthFlow,
  serializeAuthFlowError,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import {
  clearPendingStoreGoogleAuth,
  getPendingStoreGoogleAuth,
  setPendingStoreGoogleAuth,
} from "../../utils/pendingStoreGoogleAuth.js";
import {
  clearPendingGoogleAuthContext,
  setPendingGoogleAuthContext,
} from "../../utils/pendingGoogleAuthContext.js";
import { clearPendingGoogleCallbackResult } from "../../utils/pendingGoogleCallbackResult.js";
import { setPendingVerificationEmail } from "../../utils/pendingVerificationEmail.js";
import { getLandingPath } from "../../utils/roles.js";
import {
  STORE_CUSTOMER_AUTH_MODE,
  assertStoreScopedAuthResult,
  buildStoreCustomerAuthState,
  getStoreCustomerRedirectPath,
  hasStoreCustomerAuthContext,
  resolveStoreScopedAuthResult,
} from "../../utils/storeCustomerAuth.js";
import {
  setPlatformAuthToken,
  setStoredPlatformRole,
  setStoredPlatformUser,
  setStorefrontAuthToken,
  setStoredStorefrontRole,
  setStoredStorefrontUser,
} from "../../utils/token.js";
import endpoints from "../../API/endpoints.js";
import "./Login.css";

const FLOW = {
  LOGIN: "login",
  VERIFY_EMAIL: "verify-email",
  FORGOT_PASSWORD: "forgot-password",
  RESET_PASSWORD: "reset-password",
  GOOGLE_STORE_SETUP: "google-store-setup",
};

function GoogleLogoIcon() {
  return (
    <svg
      className="page-login__google-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.82 12.27c0-.77-.07-1.5-.2-2.2H12v4.17h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.06-4.4 3.06-7.61Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.76 0 5.08-.91 6.77-2.47l-3.3-2.56c-.91.61-2.08.98-3.47.98-2.67 0-4.94-1.8-5.75-4.23H2.84v2.64A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.25 13.72A6.01 6.01 0 0 1 5.92 12c0-.6.11-1.18.31-1.72V7.64H2.84A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.36l3.17-2.64Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.05c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.07 3.04 14.75 2 12 2A10 10 0 0 0 2.84 7.64l3.39 2.64c.81-2.43 3.08-4.23 5.77-4.23Z"
      />
    </svg>
  );
}

function getErrorMessage(error) {
  return extractApiError(
    error,
    "تعذر تنفيذ العملية. تحقق من البيانات ثم حاول مرة أخرى.",
  );
}

function getFlowHeading(flow) {
  if (flow === FLOW.VERIFY_EMAIL) {
    return {
      overline: "تحقق البريد",
      title: "أدخل كود التفعيل",
      description: "",
    };
  }

  if (flow === FLOW.FORGOT_PASSWORD) {
    return {
      overline: "استعادة الحساب",
      title: "إرسال كود التغيير",
      description: "",
    };
  }

  if (flow === FLOW.RESET_PASSWORD) {
    return {
      overline: "تأكيد التغيير",
      title: "كلمة مرور جديدة",
      description: "",
    };
  }

  return {
    overline: "تسجيل الدخول",
    title: "تسجيل الدخول",
    description: "",
  };
}

function getStoreFlowHeading(flow, storeLabel) {
  if (flow === FLOW.GOOGLE_STORE_SETUP) {
    return {
      overline: "Google Store Access",
      title: `إكمال الدخول إلى ${storeLabel}`,
      description:
        "حوّل جلسة Google العامة إلى StoreCustomer صالح لهذا المتجر عبر تعيين كلمة مرور ثم تسجيل الدخول.",
    };
  }
  if (flow === FLOW.FORGOT_PASSWORD) {
    return {
      overline: "استعادة الحساب",
      title: `استعادة كلمة المرور في ${storeLabel}`,
      description: "",
    };
  }

  if (flow === FLOW.RESET_PASSWORD) {
    return {
      overline: "كلمة مرور جديدة",
      title: `تغيير كلمة المرور في ${storeLabel}`,
      description: "",
    };
  }

  return {
    overline: "تسجيل الدخول",
    title: `الدخول إلى ${storeLabel}`,
    description: "",
  };
}

export default function Login() {
  const navigate = useNavigate();
  const { slug: routeStoreSlug = "" } = useParams();
  const location = useLocation();
  const { isPlatformAuthenticated, role, storeCustomer } = useAuth();
  const setPlatformSession = useAuthStore((state) => state.setPlatformSession);
  const setStorefrontSession = useAuthStore((state) => state.setStorefrontSession);
  const mergeGuestCart = useMergeGuestCart();
  const routeStoreQuery = useStoreBySlug(routeStoreSlug, {
    enabled: Boolean(routeStoreSlug),
    staleTime: 60000,
  });
  const routeStore = useMemo(
    () => normalizeEntityResponse(routeStoreQuery.data),
    [routeStoreQuery.data],
  );
  const stateStoreCustomerAuth = hasStoreCustomerAuthContext(location.state)
    ? location.state
    : null;
  const routeStoreCustomerAuthState = routeStoreSlug
    ? buildStoreCustomerAuthState({
        storeId: routeStore?.id || location.state?.storeId || "",
        storeSlug: routeStoreSlug,
        storeName: routeStore?.name || location.state?.storeName || routeStoreSlug,
        redirectTo: location.state?.redirectTo || `/market/${routeStoreSlug}`,
      })
    : null;
  const storeCustomerAuthState =
    routeStoreCustomerAuthState || stateStoreCustomerAuth;
  const resolvedGoogleStoreSlug =
    storeCustomerAuthState?.storeSlug ||
    routeStoreSlug ||
    location.state?.storeSlug ||
    "";
  const resolvedGoogleStoreId =
    storeCustomerAuthState?.storeId || location.state?.storeId || "";
  const resolvedGoogleStoreName =
    storeCustomerAuthState?.storeName ||
    routeStore?.name ||
    location.state?.storeName ||
    resolvedGoogleStoreSlug;
  const isStoreCustomerMode =
    Boolean(routeStoreSlug) || Boolean(stateStoreCustomerAuth);
  const storefrontSession = useStorefrontSession(storeCustomerAuthState?.storeId);
  const redirectTo = isStoreCustomerMode
    ? getStoreCustomerRedirectPath(storeCustomerAuthState)
    : location.state?.redirectTo || "";
  const redirectState = isStoreCustomerMode
    ? storeCustomerAuthState
    : redirectTo
      ? { redirectTo }
      : undefined;
  const storeLabel =
    resolvedGoogleStoreName ||
    resolvedGoogleStoreSlug ||
    "هذا المتجر";
  const storeHomePath = storeCustomerAuthState?.storeSlug
    ? `/market/${storeCustomerAuthState.storeSlug}`
    : "/market";
  const storeRegisterPath = storeCustomerAuthState?.storeSlug
    ? `/market/${storeCustomerAuthState.storeSlug}/register`
    : "/auth/register";
  const storeVerifyEmailPath = storeCustomerAuthState?.storeSlug
    ? `/market/${storeCustomerAuthState.storeSlug}/verify-email`
    : "/auth/verify-email";
  const canStartStoreGoogleLogin = Boolean(
    resolvedGoogleStoreSlug || resolvedGoogleStoreId,
  );

  const loginMutation = useLogin();
  const storeCustomerLoginMutation = useStoreCustomerLogin();
  const platformVerifyEmailMutation = useVerifyEmail();
  const platformResendVerificationCodeMutation = useResendVerificationCode();
  const storeCustomerVerifyEmailMutation = useStoreCustomerVerifyEmail();
  const storeCustomerResendVerificationCodeMutation =
    useStoreCustomerResendVerificationCode();
  const platformForgotPasswordMutation = useForgotPassword();
  const platformResetPasswordMutation = useResetPassword();
  const storeCustomerForgotPasswordMutation = useStoreCustomerForgotPassword();
  const storeCustomerResetPasswordMutation = useStoreCustomerResetPassword();
  const storeCustomerSetPasswordFromAuthUserMutation =
    useStoreCustomerSetPasswordFromAuthUser();
  const verifyEmailMutation = isStoreCustomerMode
    ? storeCustomerVerifyEmailMutation
    : platformVerifyEmailMutation;
  const resendVerificationCodeMutation = isStoreCustomerMode
    ? storeCustomerResendVerificationCodeMutation
    : platformResendVerificationCodeMutation;
  const forgotPasswordMutation = isStoreCustomerMode
    ? storeCustomerForgotPasswordMutation
    : platformForgotPasswordMutation;
  const resetPasswordMutation = isStoreCustomerMode
    ? storeCustomerResetPasswordMutation
    : platformResetPasswordMutation;

  const [flow, setFlow] = useState(FLOW.LOGIN);
  const [pendingEmail, setPendingEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const pendingStoreGoogleAuth = useMemo(() => {
    if (!isStoreCustomerMode) {
      return null;
    }

    const pendingAuth = getPendingStoreGoogleAuth();

    if (!pendingAuth?.appUserToken) {
      return null;
    }

    const currentStoreId = storeCustomerAuthState?.storeId || "";
    const currentStoreSlug =
      storeCustomerAuthState?.storeSlug || routeStoreSlug || "";
    const matchesStoreId =
      pendingAuth.storeId && currentStoreId && pendingAuth.storeId === currentStoreId;
    const matchesStoreSlug =
      pendingAuth.storeSlug &&
      currentStoreSlug &&
      pendingAuth.storeSlug === currentStoreSlug;

    if (!matchesStoreId && !matchesStoreSlug) {
      return null;
    }

    if (!pendingAuth.storeId && currentStoreId) {
      return {
        ...pendingAuth,
        storeId: currentStoreId,
      };
    }

    return pendingAuth;
  }, [
    isStoreCustomerMode,
    routeStoreSlug,
    storeCustomerAuthState?.storeId,
    storeCustomerAuthState?.storeSlug,
  ]);

  const defaultValues = useMemo(
    () => ({
      email: pendingStoreGoogleAuth?.email || "",
      password: "",
      verificationCode: "",
      resetCode: "",
      newPassword: "",
      confirmNewPassword: "",
    }),
    [pendingStoreGoogleAuth?.email],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues });

  useEffect(() => {
    if (!pendingStoreGoogleAuth) {
      return;
    }

    if (pendingStoreGoogleAuth.storeId !== (storeCustomerAuthState?.storeId || "")) {
      setPendingStoreGoogleAuth(pendingStoreGoogleAuth);
    }

    setValue("email", pendingStoreGoogleAuth.email || "");
    logAuthFlow("Google store auth resumed", {
      storeId: storeCustomerAuthState?.storeId || pendingStoreGoogleAuth.storeId || "",
      storeSlug: storeCustomerAuthState?.storeSlug || routeStoreSlug || "",
      email: pendingStoreGoogleAuth.email || "",
      hasAppUserToken: Boolean(pendingStoreGoogleAuth.appUserToken),
    });
  }, [
    pendingStoreGoogleAuth,
    routeStoreSlug,
    setValue,
    storeCustomerAuthState?.storeId,
    storeCustomerAuthState?.storeSlug,
  ]);

  if (routeStoreSlug && !storeCustomerAuthState?.storeId && routeStoreQuery.isLoading) {
    return (
      <Box className="page-login">
        <Box
          className="page-login__shell"
          style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
        >
          <Paper className="page-login__panel page-login__panel--form" elevation={0}>
            <Typography variant="body1">ط¬ط§ط±ظٹ طھط¬ظ‡ظٹط² ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط¬ط±...</Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  const shouldRedirectAuthenticatedUser = isStoreCustomerMode
    ? Boolean(storeCustomer) && storefrontSession.hasScopedStorefrontSession
    : isPlatformAuthenticated;

  if (shouldRedirectAuthenticatedUser) {
    return <Navigate to={redirectTo || getLandingPath(role)} replace />;
  }

  function resetAlerts() {
    setSuccessMessage("");
    setLocalError("");
  }

  function resetMutations() {
    loginMutation.reset();
    storeCustomerLoginMutation.reset();
    storeCustomerSetPasswordFromAuthUserMutation.reset();
    verifyEmailMutation.reset();
    resendVerificationCodeMutation.reset();
    forgotPasswordMutation.reset();
    resetPasswordMutation.reset();
  }

  function moveTo(nextFlow) {
    resetAlerts();
    resetMutations();
    setFlow(nextFlow);
  }

  function handleGoogleLogin() {
    if (!isStoreCustomerMode) {
      logAuthFlow("Blocked Google login because store mode was not resolved", {
        pathname: location.pathname,
        routeStoreSlug,
        stateStoreId: location.state?.storeId || "",
        stateStoreSlug: location.state?.storeSlug || "",
      });
      setLocalError("تسجيل الدخول عبر Google متاح فقط من صفحة متجر محدد.");
      return;
    }

    if (!canStartStoreGoogleLogin) {
      logAuthFlow("Blocked Google login because store context was incomplete", {
        pathname: location.pathname,
        routeStoreSlug,
        routeStoreId: routeStore?.id || "",
        stateStoreId: location.state?.storeId || "",
        stateStoreSlug: location.state?.storeSlug || "",
        resolvedGoogleStoreId,
        resolvedGoogleStoreSlug,
      });
      setLocalError(
        "بيانات المتجر غير مكتملة. افتح صفحة المتجر ثم أعد المحاولة.",
      );
      return;
    }

    try {
      setIsLoadingGoogle(true);
      clearPendingStoreGoogleAuth();
      clearPendingGoogleCallbackResult();
      const apiBaseUrl = (
        import.meta.env.VITE_API_BASE_URL || "https://mawja.premiumasp.net"
      ).replace(/\/+$/, "");
      const googleParams = new URLSearchParams();
      const googleStoreSlug = resolvedGoogleStoreSlug;
      const googleStoreId = resolvedGoogleStoreId;
      const googleStoreName = resolvedGoogleStoreName || storeLabel;
      clearPendingGoogleAuthContext();
      setPendingGoogleAuthContext({
        authMode: STORE_CUSTOMER_AUTH_MODE,
        storeId: googleStoreId,
        storeSlug: googleStoreSlug,
        storeName: googleStoreName,
        redirectTo,
      });

      if (googleStoreId) {
        googleParams.set("storeId", googleStoreId);
      }

      if (googleStoreSlug) {
        googleParams.set("storeSlug", googleStoreSlug);
      }

      if (redirectTo) {
        googleParams.set("redirectTo", redirectTo);
      }

      logAuthFlow("Starting Google store login redirect", {
        pathname: location.pathname,
        apiBaseUrl,
        routeStoreSlug,
        routeStoreId: routeStore?.id || "",
        stateStoreId: location.state?.storeId || "",
        stateStoreSlug: location.state?.storeSlug || "",
        googleStoreId,
        googleStoreSlug,
        googleStoreName,
        redirectTo,
        googleParams: googleParams.toString(),
      });

      window.location.href = `${apiBaseUrl}${endpoints.storeCustomerAuth.google}?${googleParams.toString()}`;
    } catch {
      clearPendingGoogleCallbackResult();
      clearPendingGoogleAuthContext();
      setLocalError("فشل الاتصال بخادم Google. حاول مرة أخرى.");
      setIsLoadingGoogle(false);
    }
  }

  function saveSessionFromAuthResponse(data) {
    const token = extractToken(data);
    const user = extractUser(data, token);
    const resolvedRole = extractRole(data, token, user);

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

    return resolvedRole;
  }

  function resolveCurrentStoreAuthResult(data) {
    return assertStoreScopedAuthResult(
      resolveStoreScopedAuthResult(data, storeCustomerAuthState?.storeId),
    );
  }

  function saveResolvedStoreScopedSessionFromAuthResponse(data) {
    const authResult = resolveCurrentStoreAuthResult(data);
    const { token, user, role: resolvedRole, isOwner } = authResult;

    if (isOwner) {
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

      return {
        authResult,
        role: resolvedRole,
        dashboard: "owner",
      };
    }

    if (token) {
      setStorefrontAuthToken(token);
    }

    if (user) {
      setStoredStorefrontUser(user);
    }

    if (resolvedRole) {
      setStoredStorefrontRole(resolvedRole);
    }

    if (token || user || resolvedRole) {
      setStorefrontSession({ token, user, role: resolvedRole });
    }

    return {
      authResult,
      role: resolvedRole,
      dashboard: "customer",
    };
  }

  function handleStoreCustomerLoginError(error, email) {
    if (error?.code === "STORE_SCOPE_MISMATCH") {
      setLocalError(
        "انتهت صلاحية سياق المتجر الحالي. أعد فتح المتجر الصحيح ثم سجّل الدخول مرة أخرى.",
      );
      return;
    }

    if (error?.code === "STORE_SCOPE_UNRESOLVED") {
      setLocalError(
        "طھط¹ط°ط± طھط£ظƒظٹط¯ ط§ظ†طھظ…ط§ط، ظ‡ط°ط§ ط§ظ„ط­ط³ط§ط¨ ظ„ظ„ظ…طھط¬ط± ط§ظ„ط­ط§ظ„ظٹ. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.",
      );
      return;
    }

    if (error?.code === "STORE_MEMBERSHIP_REQUIRED") {
      setLocalError(
        "ظ‡ط°ط§ ط§ظ„ط­ط³ط§ط¨ ظ„ظٹط³ ظ…ط§ظ„ظƒظ‹ط§ ظ„ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط± ظˆظ„ط§ ط²ط¨ظˆظ†ظ‹ط§ ظ…ط³ط¬ظ„ظ‹ط§ ظپظٹظ‡.",
      );
      return;
    }

    const responseData = error?.response?.data;
    const statusCode = Number(error?.response?.status || 0);
    const needsVerification =
      statusCode === 401 &&
      responseData?.requiresEmailVerification === true;

    if (needsVerification) {
      const verificationEmail = responseData?.email || email;
      setPendingVerificationEmail(verificationEmail);
      navigate(storeVerifyEmailPath, {
        replace: true,
        state: {
          ...storeCustomerAuthState,
          email: verificationEmail,
          redirectTo,
          message:
            responseData?.message ||
            "لا يمكنك تسجيل الدخول قبل تفعيل البريد الإلكتروني. أدخل كود التحقق.",
        },
      });
      return;
    }

    if (statusCode === 403) {
      setLocalError(
        "هذا الحساب ليس مالكًا لهذا المتجر أو غير مخوّل للدخول إليه.",
      );
      return;
    }

    if (statusCode === 400 || statusCode === 401) {
      setLocalError(
        responseData?.message ||
          "البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الحساب لا يحقق شروط الدخول.",
      );
      return;
    }

    setLocalError(getErrorMessage(error));
  }

  const onLoginSubmit = handleSubmit(async (values) => {
    resetAlerts();

    const email = values.email.trim();
    logAuthFlow("Login submit", {
      authMode: isStoreCustomerMode ? "store" : "platform",
      email,
      requestStoreId: storeCustomerAuthState?.storeId || "",
      storeSlug: storeCustomerAuthState?.storeSlug || "",
      redirectTo,
    });

    try {
      if (isStoreCustomerMode) {
        if (!storeCustomerAuthState?.storeId) {
          setLocalError(
            "بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.",
          );
          return;
        }

        try {
          const data = await storeCustomerLoginMutation.mutateAsync({
            storeId: storeCustomerAuthState.storeId,
            email,
            password: values.password,
          });
          const authResult = resolveCurrentStoreAuthResult(data);

          clearPendingStoreGoogleAuth();
          logAuthFlow("Store login navigation decision", {
            requestStoreId: storeCustomerAuthState.storeId,
            responseStoreId: authResult.responseStoreId,
            responseStoreCustomerId: authResult.responseStoreCustomerId,
            isOwner: authResult.isOwner,
            isCustomer: authResult.isCustomer,
            role: authResult.role,
            user: serializeAuthFlowUser(authResult.user),
          });

          if (authResult.isOwner) {
            logAuthFlow("Navigating to owner dashboard", {
              targetPath: "/owner",
              storeId: storeCustomerAuthState.storeId,
              storeSlug: storeCustomerAuthState.storeSlug || "",
            });
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

          await mergeGuestCart();
          logAuthFlow("Navigating to store after customer login", {
            targetPath: redirectTo,
            storeId: authResult.responseStoreId,
            storeCustomerId: authResult.responseStoreCustomerId,
          });
          navigate(redirectTo, { replace: true });
          return;
        } catch (storeCustomerError) {
          logAuthFlow("Store login submit failed", {
            email,
            requestStoreId: storeCustomerAuthState?.storeId || "",
            error: serializeAuthFlowError(storeCustomerError),
          });
          handleStoreCustomerLoginError(storeCustomerError, email);
          return;
        }
      }

      const data = await loginMutation.mutateAsync({
        email,
        password: values.password,
      });
      const token = extractToken(data);
      const user = extractUser(data, token);
      const sessionRole = extractRole(data, token, user);
      logAuthFlow("Platform login success", {
        email,
        role: sessionRole,
        user: serializeAuthFlowUser(user),
        targetPath: redirectTo || getLandingPath(sessionRole),
      });

      navigate(redirectTo || getLandingPath(sessionRole), { replace: true });
    } catch (error) {
      logAuthFlow("Login submit failed", {
        authMode: isStoreCustomerMode ? "store" : "platform",
        email,
        requestStoreId: storeCustomerAuthState?.storeId || "",
        error: serializeAuthFlowError(error),
      });
      if (isStoreCustomerMode) {
        const responseData = error?.response?.data;
        const needsVerification =
          error?.response?.status === 401 &&
          responseData?.requiresEmailVerification === true;

        if (needsVerification) {
          const verificationEmail = responseData?.email || email;
          setPendingVerificationEmail(verificationEmail);
          navigate(storeVerifyEmailPath, {
            replace: true,
            state: {
              ...storeCustomerAuthState,
              email: verificationEmail,
              redirectTo,
              message:
                responseData?.message ||
                "لا يمكنك تسجيل الدخول قبل تفعيل البريد الإلكتروني. أدخل كود التحقق.",
            },
          });
          return;
        }

        handleStoreCustomerLoginError(error, email);
        return;
      }

      const responseData = error?.response?.data;
      const needsVerification =
        error?.response?.status === 401 &&
        responseData?.requiresEmailVerification === true;

      if (needsVerification) {
        setPendingVerificationEmail(responseData?.email || email);
        navigate("/auth/verify-email", {
          state: {
            email: responseData?.email || email,
            message:
              responseData?.message ||
              "لا يمكنك تسجيل الدخول قبل تفعيل البريد الإلكتروني. أدخل كود التحقق.",
            redirectTo,
          },
        });
        return;
      }

      setLocalError(getErrorMessage(error));
    }
  });

  const onGoogleStoreSetupSubmit = handleSubmit(async (values) => {
    resetAlerts();

    if (!pendingStoreGoogleAuth?.appUserToken) {
      clearPendingStoreGoogleAuth();
      moveTo(FLOW.LOGIN);
      setLocalError(
        "انتهت جلسة Google الخاصة بهذا المتجر. ابدأ الدخول عبر Google مرة أخرى.",
      );
      return;
    }

    const resolvedStoreId =
      storeCustomerAuthState?.storeId || pendingStoreGoogleAuth.storeId;
    const email = pendingStoreGoogleAuth.email || values.email.trim();

    if (!resolvedStoreId) {
      setLocalError("تعذر تحديد المتجر المطلوب لإكمال دخول Google.");
      return;
    }

    if (!email) {
      setLocalError("تعذر تحديد البريد المرتبط بحساب Google لهذا المتجر.");
      return;
    }

    logAuthFlow("Google store setup submit", {
      storeId: resolvedStoreId,
      storeSlug: storeCustomerAuthState?.storeSlug || "",
      email,
      hasAppUserToken: Boolean(pendingStoreGoogleAuth?.appUserToken),
    });

    try {
      await storeCustomerSetPasswordFromAuthUserMutation.mutateAsync({
        storeId: resolvedStoreId,
        appUserToken: pendingStoreGoogleAuth.appUserToken,
        newPassword: values.newPassword,
        confirmPassword: values.confirmNewPassword,
      });

      const data = await storeCustomerLoginMutation.mutateAsync({
        storeId: resolvedStoreId,
        email,
        password: values.newPassword,
      });
      const authResult = resolveCurrentStoreAuthResult(data);

      clearPendingStoreGoogleAuth();
      clearPendingGoogleCallbackResult();
      clearPendingGoogleAuthContext();
      setValue("password", "");
      setValue("newPassword", "");
      setValue("confirmNewPassword", "");
      logAuthFlow("Google store setup login classified", {
        storeId: resolvedStoreId,
        responseStoreId: authResult.responseStoreId,
        responseStoreCustomerId: authResult.responseStoreCustomerId,
        isOwner: authResult.isOwner,
        role: authResult.role,
        user: serializeAuthFlowUser(authResult.user),
      });

      if (authResult.isOwner) {
        logAuthFlow("Navigating to owner dashboard after Google store setup", {
          targetPath: "/owner",
          storeId: resolvedStoreId,
          storeSlug: storeCustomerAuthState?.storeSlug || "",
        });
        navigate("/owner", {
          replace: true,
          state: {
            storeId: resolvedStoreId,
            storeSlug: storeCustomerAuthState?.storeSlug,
            fromStoreLogin: true,
          },
        });
        return;
      }

      await mergeGuestCart();
      logAuthFlow("Navigating to store after Google store setup", {
        targetPath: redirectTo,
        storeId: authResult.responseStoreId,
        storeCustomerId: authResult.responseStoreCustomerId,
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      logAuthFlow("Google store setup failed", {
        storeId: resolvedStoreId,
        email,
        error: serializeAuthFlowError(error),
      });
      if (
        error?.code === "STORE_SCOPE_MISMATCH" ||
        error?.code === "STORE_SCOPE_UNRESOLVED" ||
        error?.code === "STORE_MEMBERSHIP_REQUIRED"
      ) {
        handleStoreCustomerLoginError(error, email);
        return;
      }

      setLocalError(getErrorMessage(error));
    }
  });

  const onVerifyEmailSubmit = handleSubmit(async (values) => {
    resetAlerts();

    const email = pendingEmail || values.email.trim();
    const code = values.verificationCode.trim();
    logAuthFlow("Verify email submit", {
      authMode: isStoreCustomerMode ? "store" : "platform",
      email,
      codeLength: code.length,
      requestStoreId: storeCustomerAuthState?.storeId || "",
    });

    try {
      if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
        setLocalError(
          "ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط¬ط± ظ„ظ… طھظƒطھظ…ظ„ ط¨ط¹ط¯. ط§ظ†طھط¸ط± ظ„ط­ط¸ط© ط«ظ… ط£ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط©.",
        );
        return;
      }

      const data = await verifyEmailMutation.mutateAsync(
        isStoreCustomerMode
          ? {
              storeId: storeCustomerAuthState?.storeId,
              email,
              code,
            }
          : {
              email,
              code,
            },
      );
      const resolvedSession = isStoreCustomerMode
        ? saveResolvedStoreScopedSessionFromAuthResponse(data)
        : {
            role: saveSessionFromAuthResponse(data),
            dashboard: "platform",
          };

      if (isStoreCustomerMode) {
        if (resolvedSession.dashboard === "owner") {
          logAuthFlow("Verify email resolved owner session", {
            email,
            storeId: storeCustomerAuthState?.storeId || "",
            role: resolvedSession.role,
            user: serializeAuthFlowUser(resolvedSession.authResult?.user),
            targetPath: "/owner",
          });
          navigate("/owner", {
            replace: true,
            state: {
              storeId: storeCustomerAuthState?.storeId,
              storeSlug: storeCustomerAuthState?.storeSlug,
              fromStoreLogin: true,
            },
          });
          return;
        }

        await mergeGuestCart();
        logAuthFlow("Verify email resolved storefront session", {
          email,
          storeId: resolvedSession.authResult?.responseStoreId || "",
          storeCustomerId:
            resolvedSession.authResult?.responseStoreCustomerId || "",
          role: resolvedSession.role,
          user: serializeAuthFlowUser(resolvedSession.authResult?.user),
          targetPath: redirectTo,
        });
        navigate(redirectTo, { replace: true });
        return;
      }

      await mergeGuestCart();
      logAuthFlow("Verify email resolved platform session", {
        email,
        role: resolvedSession.role,
        targetPath: redirectTo || getLandingPath(resolvedSession.role),
      });
      navigate(redirectTo || getLandingPath(resolvedSession.role), { replace: true });
    } catch (error) {
      logAuthFlow("Verify email failed", {
        authMode: isStoreCustomerMode ? "store" : "platform",
        email,
        requestStoreId: storeCustomerAuthState?.storeId || "",
        error: serializeAuthFlowError(error),
      });
      if (
        isStoreCustomerMode &&
        (
          error?.code === "STORE_SCOPE_MISMATCH" ||
          error?.code === "STORE_SCOPE_UNRESOLVED" ||
          error?.code === "STORE_MEMBERSHIP_REQUIRED"
        )
      ) {
        handleStoreCustomerLoginError(error, email);
        return;
      }

      setLocalError(getErrorMessage(error));
    }
  });

  const onResendVerificationCode = async () => {
    resetAlerts();

    const email = pendingEmail || getValues("email").trim();

    if (!email) {
      setLocalError("أدخل البريد الإلكتروني أولًا.");
      return;
    }

    try {
      if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
        setLocalError(
          "ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط¬ط± ظ„ظ… طھظƒطھظ…ظ„ ط¨ط¹ط¯. ط§ظ†طھط¸ط± ظ„ط­ط¸ط© ط«ظ… ط£ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط©.",
        );
        return;
      }

      await resendVerificationCodeMutation.mutateAsync(
        isStoreCustomerMode
          ? {
              storeId: storeCustomerAuthState?.storeId,
              email,
            }
          : { email },
      );
      setSuccessMessage("تم إرسال كود التفعيل مرة أخرى إلى بريدك الإلكتروني.");
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  };

  const onForgotPasswordSubmit = handleSubmit(async (values) => {
    resetAlerts();

    const email = values.email.trim();

    try {
      if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
        setLocalError(
          "بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.",
        );
        return;
      }

      const data = await forgotPasswordMutation.mutateAsync(
        isStoreCustomerMode
          ? {
              storeId: storeCustomerAuthState.storeId,
              email,
            }
          : { email },
      );
      setPendingEmail(email);
      setValue("resetCode", "");
      setValue("newPassword", "");
      setValue("confirmNewPassword", "");
      moveTo(FLOW.RESET_PASSWORD);
      setSuccessMessage(
        data?.message ||
          "إذا كان البريد موجودًا، فسيتم إرسال كود إعادة تعيين كلمة المرور.",
      );
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  });

  const onResendResetCode = async () => {
    resetAlerts();

    const email = pendingEmail || getValues("email").trim();

    if (!email) {
      setLocalError("أدخل البريد الإلكتروني أولًا.");
      return;
    }

    try {
      if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
        setLocalError(
          "بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.",
        );
        return;
      }

      const data = await forgotPasswordMutation.mutateAsync(
        isStoreCustomerMode
          ? {
              storeId: storeCustomerAuthState.storeId,
              email,
            }
          : { email },
      );
      setSuccessMessage(
        data?.message ||
          "إذا كان البريد موجودًا، فسيتم إرسال كود إعادة تعيين كلمة المرور.",
      );
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  };

  const onResetPasswordSubmit = handleSubmit(async (values) => {
    resetAlerts();

    const email = pendingEmail || values.email.trim();
    const code = values.resetCode.trim();

    try {
      if (isStoreCustomerMode && !storeCustomerAuthState?.storeId) {
        setLocalError(
          "بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.",
        );
        return;
      }

      const data = await resetPasswordMutation.mutateAsync(
        isStoreCustomerMode
          ? {
              storeId: storeCustomerAuthState.storeId,
              email,
              code,
              newPassword: values.newPassword,
            }
          : {
              email,
              code,
              resetCode: code,
              newPassword: values.newPassword,
              confirmPassword: values.confirmNewPassword,
            },
      );

      setValue("password", "");
      setValue("resetCode", "");
      setValue("newPassword", "");
      setValue("confirmNewPassword", "");
      resetMutations();
      setFlow(FLOW.LOGIN);
      setSuccessMessage(
        data?.message ||
          "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
      );
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  });

  const isBusy =
    loginMutation.isPending ||
    storeCustomerLoginMutation.isPending ||
    storeCustomerSetPasswordFromAuthUserMutation.isPending ||
    verifyEmailMutation.isPending ||
    resendVerificationCodeMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;
  const activeFlow = pendingStoreGoogleAuth ? FLOW.GOOGLE_STORE_SETUP : flow;

  const heading = isStoreCustomerMode
    ? getStoreFlowHeading(activeFlow, storeLabel)
    : getFlowHeading(activeFlow);

  return (
    <Box className="page-login">
      <Box className="page-login__glow page-login__glow--one" aria-hidden />
      <Box className="page-login__glow page-login__glow--two" aria-hidden />

      <Box className="page-login__shell">
        <Paper
          className="page-login__panel page-login__panel--form"
          elevation={0}
        >
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="overline" className="page-login__eyebrow">
                {heading.overline}
              </Typography>
              <Typography variant="h4" className="page-login__form-title">
                {heading.title}
              </Typography>
              {heading.description ? (
                <Typography variant="body2" color="text.secondary">
                  {heading.description}
                </Typography>
              ) : null}
            </Box>

            {successMessage ? (
              <Alert severity="success">{successMessage}</Alert>
            ) : null}
            {localError ? <Alert severity="error">{localError}</Alert> : null}

            {activeFlow === FLOW.LOGIN ? (
              <Stack spacing={1.5} component="form" onSubmit={onLoginSubmit}>
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
                    required: "هذا الحقل مطلوب",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "يرجى إدخال بريد إلكتروني صحيح",
                    },
                  })}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />

                <TextField
                  label="كلمة المرور"
                  type="password"
                  fullWidth
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("password", {
                    required: "كلمة المرور مطلوبة",
                    minLength: {
                      value: 6,
                      message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                    },
                  })}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isBusy || isLoadingGoogle}
                >
                  {loginMutation.isPending ||
                  storeCustomerLoginMutation.isPending
                    ? "جارٍ تسجيل الدخول..."
                    : isStoreCustomerMode
                      ? "الدخول إلى المتجر"
                      : "الدخول إلى حسابي"}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => moveTo(FLOW.FORGOT_PASSWORD)}
                  disabled={isBusy || isLoadingGoogle}
                >
                  نسيت أو أريد تغيير كلمة السر
                </Button>

                {isStoreCustomerMode ? (
                  <>
                    <Divider />

                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      className="page-login__google-button"
                      startIcon={<GoogleLogoIcon />}
                      onClick={handleGoogleLogin}
                      disabled={
                        isBusy ||
                        isLoadingGoogle ||
                        !canStartStoreGoogleLogin
                      }
                    >
                      {isLoadingGoogle
                    ? "جارٍ الاتصال بـ Google..."
                    : "الدخول عبر Google"}
                    </Button>
                  </>
                ) : null}

                <Divider />

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    component={RouterLink}
                    to={isStoreCustomerMode ? storeHomePath : "/market"}
                    variant="outlined"
                  >
                    {isStoreCustomerMode
                      ? "العودة إلى المتجر"
                      : "العودة إلى السوق"}
                  </Button>
                  {isStoreCustomerMode ? (
                    <Button
                      component={RouterLink}
                      to={storeRegisterPath}
                      state={redirectState}
                      variant="text"
                    >
                      إنشاء حساب جديد
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            ) : null}

            {activeFlow === FLOW.GOOGLE_STORE_SETUP ? (
              <Stack
                spacing={1.5}
                component="form"
                onSubmit={onGoogleStoreSetupSubmit}
              >
                <Alert severity="info">
                  تم التحقق من حساب Google. عيّن كلمة مرور لهذا المتجر ليتم إنشاء جلسة StoreCustomer صالحة للسلة والطلبات.
                </Alert>

                <TextField
                  label="البريد الإلكتروني"
                  value={pendingStoreGoogleAuth?.email || getValues("email")}
                  disabled
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="كلمة مرور جديدة لهذا المتجر"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("newPassword", {
                    required: "كلمة المرور مطلوبة",
                    minLength: {
                      value: 6,
                      message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                    },
                  })}
                  error={Boolean(errors.newPassword)}
                  helperText={errors.newPassword?.message}
                />

                <TextField
                  label="تأكيد كلمة المرور"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("confirmNewPassword", {
                    required: "تأكيد كلمة المرور مطلوب",
                    validate: (value) =>
                      value === getValues("newPassword") ||
                      "كلمتا المرور غير متطابقتين",
                  })}
                  error={Boolean(errors.confirmNewPassword)}
                  helperText={errors.confirmNewPassword?.message}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isBusy}
                >
                  {storeCustomerSetPasswordFromAuthUserMutation.isPending ||
                  storeCustomerLoginMutation.isPending
                    ? "جارٍ إكمال الدخول..."
                    : "إكمال الدخول إلى المتجر"}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => {
                    clearPendingStoreGoogleAuth();
                    setValue("newPassword", "");
                    setValue("confirmNewPassword", "");
                    moveTo(FLOW.LOGIN);
                  }}
                  disabled={isBusy}
                >
                  رجوع إلى تسجيل الدخول العادي
                </Button>
              </Stack>
            ) : null}

            {activeFlow === FLOW.VERIFY_EMAIL ? (
              <Stack
                spacing={1.5}
                component="form"
                onSubmit={onVerifyEmailSubmit}
              >
                <TextField
                  label="البريد الإلكتروني"
                  value={pendingEmail}
                  disabled
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="كود التفعيل"
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
                  {...register("verificationCode", {
                    required: "كود التفعيل مطلوب",
                    minLength: {
                      value: 4,
                      message: "الكود غير صالح",
                    },
                  })}
                  error={Boolean(errors.verificationCode)}
                  helperText={errors.verificationCode?.message}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isBusy}
                >
                  {verifyEmailMutation.isPending
                    ? "جارٍ التحقق..."
                    : "تأكيد الكود وإكمال الدخول"}
                </Button>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={onResendVerificationCode}
                    disabled={isBusy}
                  >
                    {resendVerificationCodeMutation.isPending
                      ? "جارٍ الإرسال..."
                      : "إعادة إرسال الكود"}
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => moveTo(FLOW.LOGIN)}
                    disabled={isBusy}
                  >
                    رجوع لتسجيل الدخول
                  </Button>
                </Stack>
              </Stack>
            ) : null}

            {activeFlow === FLOW.FORGOT_PASSWORD ? (
              <Stack
                spacing={1.5}
                component="form"
                onSubmit={onForgotPasswordSubmit}
              >
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
                    required: "هذا الحقل مطلوب",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "يرجى إدخال بريد إلكتروني صحيح",
                    },
                  })}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isBusy}
                >
                  {forgotPasswordMutation.isPending
                    ? "جارٍ إرسال الكود..."
                    : "إرسال كود تغيير كلمة السر"}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => moveTo(FLOW.LOGIN)}
                  disabled={isBusy}
                >
                  رجوع لتسجيل الدخول
                </Button>
              </Stack>
            ) : null}

            {activeFlow === FLOW.RESET_PASSWORD ? (
              <Stack
                spacing={1.5}
                component="form"
                onSubmit={onResetPasswordSubmit}
              >
                <TextField
                  label="البريد الإلكتروني"
                  value={pendingEmail}
                  disabled
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
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
                  {...register("resetCode", {
                    required: "كود التحقق مطلوب",
                    minLength: {
                      value: 4,
                      message: "الكود غير صالح",
                    },
                  })}
                  error={Boolean(errors.resetCode)}
                  helperText={errors.resetCode?.message}
                />

                <TextField
                  label="كلمة المرور الجديدة"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("newPassword", {
                    required: "كلمة المرور الجديدة مطلوبة",
                    minLength: {
                      value: 6,
                      message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
                    },
                  })}
                  error={Boolean(errors.newPassword)}
                  helperText={errors.newPassword?.message}
                />

                <TextField
                  label="تأكيد كلمة المرور الجديدة"
                  type="password"
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("confirmNewPassword", {
                    required: "يرجى تأكيد كلمة المرور",
                    validate: (value) =>
                      value === getValues("newPassword") ||
                      "كلمتا المرور غير متطابقتين",
                  })}
                  error={Boolean(errors.confirmNewPassword)}
                  helperText={errors.confirmNewPassword?.message}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isBusy}
                >
                  {resetPasswordMutation.isPending
                    ? "جارٍ تغيير كلمة المرور..."
                    : "تأكيد التغيير"}
                </Button>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={onResendResetCode}
                    disabled={isBusy}
                  >
                    إعادة إرسال الكود
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => moveTo(FLOW.LOGIN)}
                    disabled={isBusy}
                  >
                    رجوع لتسجيل الدخول
                  </Button>
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
