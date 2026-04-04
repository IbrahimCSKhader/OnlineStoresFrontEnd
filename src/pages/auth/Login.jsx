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
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import useAuth from "../../hooks/auth/useAuth.js";
import useLogin from "../../hooks/auth/useLogin.js";
import useStoreCustomerLogin from "../../hooks/auth/useStoreCustomerLogin.js";
import useVerifyEmail from "../../hooks/auth/useVerifyEmail.js";
import useResendVerificationCode from "../../hooks/auth/useResendVerificationCode.js";
import useForgotPassword from "../../hooks/auth/useForgotPassword.js";
import useResetPassword from "../../hooks/auth/useResetPassword.js";
import useStoreCustomerForgotPassword from "../../hooks/auth/useStoreCustomerForgotPassword.js";
import useStoreCustomerResetPassword from "../../hooks/auth/useStoreCustomerResetPassword.js";
import useMergeGuestCart from "../../hooks/cart/useMergeGuestCart.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import { setPendingVerificationEmail } from "../../utils/pendingVerificationEmail.js";
import { getLandingPath } from "../../utils/roles.js";
import {
  buildStoreCustomerAuthState,
  getStoreCustomerRedirectPath,
  hasStoreCustomerAuthContext,
} from "../../utils/storeCustomerAuth.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "../../utils/token.js";
import "./Login.css";

const FLOW = {
  LOGIN: "login",
  VERIFY_EMAIL: "verify-email",
  FORGOT_PASSWORD: "forgot-password",
  RESET_PASSWORD: "reset-password",
};

function getErrorMessage(error) {
  return extractApiError(error, "تعذر تنفيذ العملية. تحقق من البيانات ثم حاول مرة أخرى.");
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
  const { isStoreCustomer, isPlatformUser, role } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);
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
        storeId: routeStore?.id || "",
        storeSlug: routeStoreSlug,
        storeName: routeStore?.name || routeStoreSlug,
        redirectTo: location.state?.redirectTo || `/market/${routeStoreSlug}`,
      })
    : null;
  const storeCustomerAuthState = routeStoreCustomerAuthState || stateStoreCustomerAuth;
  const isStoreCustomerMode = Boolean(routeStoreSlug) || Boolean(stateStoreCustomerAuth);
  const redirectTo = isStoreCustomerMode
    ? getStoreCustomerRedirectPath(storeCustomerAuthState)
    : location.state?.redirectTo || "";
  const redirectState = isStoreCustomerMode
    ? storeCustomerAuthState
    : redirectTo
      ? { redirectTo }
      : undefined;
  const storeLabel =
    storeCustomerAuthState?.storeName ||
    storeCustomerAuthState?.storeSlug ||
    "هذا المتجر";
  const storeHomePath =
    storeCustomerAuthState?.storeSlug
      ? `/market/${storeCustomerAuthState.storeSlug}`
      : "/market";
  const storeRegisterPath =
    storeCustomerAuthState?.storeSlug
      ? `/market/${storeCustomerAuthState.storeSlug}/register`
      : "/auth/register";
  const storeVerifyEmailPath =
    storeCustomerAuthState?.storeSlug
      ? `/market/${storeCustomerAuthState.storeSlug}/verify-email`
      : "/auth/verify-email";

  const loginMutation = useLogin();
  const storeCustomerLoginMutation = useStoreCustomerLogin();
  const verifyEmailMutation = useVerifyEmail();
  const resendVerificationCodeMutation = useResendVerificationCode();
  const platformForgotPasswordMutation = useForgotPassword();
  const platformResetPasswordMutation = useResetPassword();
  const storeCustomerForgotPasswordMutation = useStoreCustomerForgotPassword();
  const storeCustomerResetPasswordMutation = useStoreCustomerResetPassword();
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

  const defaultValues = useMemo(
    () => ({
      email: "",
      password: "",
      verificationCode: "",
      resetCode: "",
      newPassword: "",
      confirmNewPassword: "",
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues });

  if (isStoreCustomerMode ? isStoreCustomer : isPlatformUser) {
    return <Navigate to={redirectTo || getLandingPath(role)} replace />;
  }

  function resetAlerts() {
    setSuccessMessage("");
    setLocalError("");
  }

  function resetMutations() {
    loginMutation.reset();
    storeCustomerLoginMutation.reset();
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
    try {
      setIsLoadingGoogle(true);
      const apiBaseUrl = (
        import.meta.env.VITE_API_BASE_URL || "https://mawja.premiumasp.net"
      ).replace(/\/+$/, "");

      window.location.href = `${apiBaseUrl}/api/auth/google`;
    } catch {
      setLocalError("فشل الاتصال بخادم Google. حاول مرة أخرى.");
      setIsLoadingGoogle(false);
    }
  }

  function saveSessionFromAuthResponse(data) {
    const token = extractToken(data);
    const user = extractUser(data, token);
    const resolvedRole = extractRole(data, token, user);

    if (token) {
      setAuthToken(token);
    }

    if (user) {
      setStoredAuthUser(user);
    }

    if (resolvedRole) {
      setStoredAuthRole(resolvedRole);
    }

    if (token || user || resolvedRole) {
      setSession({ token, user, role: resolvedRole });
    }

    return resolvedRole;
  }

  const onLoginSubmit = handleSubmit(async (values) => {
    resetAlerts();

    const email = values.email.trim();

    try {
      if (isStoreCustomerMode) {
        if (!storeCustomerAuthState?.storeId) {
          setLocalError("بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.");
          return;
        }

        await storeCustomerLoginMutation.mutateAsync({
          storeId: storeCustomerAuthState.storeId,
          email,
          password: values.password,
        });
        await mergeGuestCart();
        navigate(redirectTo, { replace: true });
        return;
      }

      const data = await loginMutation.mutateAsync({
        email,
        password: values.password,
      });
      const token = extractToken(data);
      const user = extractUser(data, token);
      const sessionRole = extractRole(data, token, user);
      navigate(redirectTo || getLandingPath(sessionRole), { replace: true });
    } catch (error) {
      if (isStoreCustomerMode) {
        const responseData = error?.response?.data;
        const needsVerification =
          error?.response?.status === 401 && responseData?.requiresEmailVerification === true;

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

        setLocalError(getErrorMessage(error));
        return;
      }

      const responseData = error?.response?.data;
      const needsVerification =
        error?.response?.status === 401 && responseData?.requiresEmailVerification === true;

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

  const onVerifyEmailSubmit = handleSubmit(async (values) => {
    resetAlerts();

    const email = pendingEmail || values.email.trim();
    const code = values.verificationCode.trim();

    try {
      const data = await verifyEmailMutation.mutateAsync({ email, code });
      const sessionRole = saveSessionFromAuthResponse(data);
      await mergeGuestCart();
      navigate(redirectTo || getLandingPath(sessionRole), { replace: true });
    } catch (error) {
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
      await resendVerificationCodeMutation.mutateAsync({ email });
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
        setLocalError("بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.");
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
        data?.message || "إذا كان البريد موجودًا، فسيتم إرسال كود إعادة تعيين كلمة المرور.",
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
        setLocalError("بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.");
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
        data?.message || "إذا كان البريد موجودًا، فسيتم إرسال كود إعادة تعيين كلمة المرور.",
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
        setLocalError("بيانات المتجر لم تكتمل بعد. انتظر لحظة ثم أعد المحاولة.");
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
              newPassword: values.newPassword,
            },
      );

      setValue("password", "");
      setValue("resetCode", "");
      setValue("newPassword", "");
      setValue("confirmNewPassword", "");
      resetMutations();
      setFlow(FLOW.LOGIN);
      setSuccessMessage(
        data?.message || "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
      );
    } catch (error) {
      setLocalError(getErrorMessage(error));
    }
  });

  const isBusy =
    loginMutation.isPending ||
    storeCustomerLoginMutation.isPending ||
    verifyEmailMutation.isPending ||
    resendVerificationCodeMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;

  const heading = isStoreCustomerMode
    ? getStoreFlowHeading(flow, storeLabel)
    : getFlowHeading(flow);

  return (
    <Box className="page-login">
      <Box className="page-login__glow page-login__glow--one" aria-hidden />
      <Box className="page-login__glow page-login__glow--two" aria-hidden />

      <Box className="page-login__shell">
        <Paper className="page-login__panel page-login__panel--form" elevation={0}>
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

            {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
            {localError ? <Alert severity="error">{localError}</Alert> : null}

            {flow === FLOW.LOGIN ? (
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

                <Button type="submit" variant="contained" size="large" disabled={isBusy || isLoadingGoogle}>
                  {loginMutation.isPending || storeCustomerLoginMutation.isPending
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

                <Divider />

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleGoogleLogin}
                  disabled={isBusy || isLoadingGoogle}
                >
                  {isLoadingGoogle ? "جارٍ الاتصال بـ Google..." : "الدخول عبر Google"}
                </Button>

                <Divider />

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    component={RouterLink}
                    to={isStoreCustomerMode ? storeHomePath : "/market"}
                    variant="outlined"
                  >
                    {isStoreCustomerMode ? "العودة إلى المتجر" : "العودة إلى السوق"}
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

            {flow === FLOW.VERIFY_EMAIL ? (
              <Stack spacing={1.5} component="form" onSubmit={onVerifyEmailSubmit}>
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

                <Button type="submit" variant="contained" size="large" disabled={isBusy}>
                  {verifyEmailMutation.isPending ? "جارٍ التحقق..." : "تأكيد الكود وإكمال الدخول"}
                </Button>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={onResendVerificationCode}
                    disabled={isBusy}
                  >
                    {resendVerificationCodeMutation.isPending ? "جارٍ الإرسال..." : "إعادة إرسال الكود"}
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

            {flow === FLOW.FORGOT_PASSWORD ? (
              <Stack spacing={1.5} component="form" onSubmit={onForgotPasswordSubmit}>
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

                <Button type="submit" variant="contained" size="large" disabled={isBusy}>
                  {forgotPasswordMutation.isPending ? "جارٍ إرسال الكود..." : "إرسال كود تغيير كلمة السر"}
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

            {flow === FLOW.RESET_PASSWORD ? (
              <Stack spacing={1.5} component="form" onSubmit={onResetPasswordSubmit}>
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
                      value === getValues("newPassword") || "كلمتا المرور غير متطابقتين",
                  })}
                  error={Boolean(errors.confirmNewPassword)}
                  helperText={errors.confirmNewPassword?.message}
                />

                <Button type="submit" variant="contained" size="large" disabled={isBusy}>
                  {resetPasswordMutation.isPending ? "جارٍ تغيير كلمة المرور..." : "تأكيد التغيير"}
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
