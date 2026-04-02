import { useMemo, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
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
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import useAuth from "../../hooks/auth/useAuth.js";
import useLogin from "../../hooks/auth/useLogin.js";
import useVerifyEmail from "../../hooks/auth/useVerifyEmail.js";
import useResendVerificationCode from "../../hooks/auth/useResendVerificationCode.js";
import useForgotPassword from "../../hooks/auth/useForgotPassword.js";
import useResetPassword from "../../hooks/auth/useResetPassword.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import extractApiError from "../../utils/extractApiError.js";
import { setPendingVerificationEmail } from "../../utils/pendingVerificationEmail.js";
import { getLandingPath } from "../../utils/roles.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "../../utils/token.js";
import "./Login.css";

const highlights = [
  {
    icon: <StorefrontRoundedIcon fontSize="small" />,
    title: "مساحة واحدة للمتجر",
    description: "تابع المنتجات والطلبات والعروض من واجهة مرتبة وسريعة.",
  },
  {
    icon: <VerifiedRoundedIcon fontSize="small" />,
    title: "وصول واضح",
    description: "كل حساب يصل مباشرة إلى المساحة المناسبة له بدون خطوات مربكة.",
  },
  {
    icon: <SecurityRoundedIcon fontSize="small" />,
    title: "دخول مريح وآمن",
    description: "ابدأ يومك بسرعة مع تجربة هادئة ونصوص واضحة وسهلة.",
  },
];

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
      title: "أدخل كود التفعيل لإكمال تسجيل الدخول",
      description: "أرسلنا لك كودًا على البريد الإلكتروني. أدخله لتفعيل الحساب وإكمال الدخول.",
    };
  }

  if (flow === FLOW.FORGOT_PASSWORD) {
    return {
      overline: "استعادة الحساب",
      title: "أرسل كود تغيير كلمة السر",
      description: "اكتب البريد الإلكتروني وسنرسل كودًا لإعادة تعيين كلمة المرور.",
    };
  }

  if (flow === FLOW.RESET_PASSWORD) {
    return {
      overline: "تأكيد التغيير",
      title: "أدخل الكود وكلمة السر الجديدة",
      description: "بعد إدخال الكود الصحيح سيتم تغيير كلمة المرور مباشرة.",
    };
  }

  return {
    overline: "أهلًا بعودتك",
    title: "سجل دخولك وابدأ يومك بسهولة",
    description: "استخدم البريد الإلكتروني، ثم أكمل بكلمة المرور.",
  };
}

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);

  const loginMutation = useLogin();
  const verifyEmailMutation = useVerifyEmail();
  const resendVerificationCodeMutation = useResendVerificationCode();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  const [flow, setFlow] = useState(FLOW.LOGIN);
  const [pendingEmail, setPendingEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");

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

  if (isAuthenticated) {
    return <Navigate to={getLandingPath(role)} replace />;
  }

  function resetAlerts() {
    setSuccessMessage("");
    setLocalError("");
  }

  function resetMutations() {
    loginMutation.reset();
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

  function saveSessionFromAuthResponse(data) {
    const token = extractToken(data);
    const user = extractUser(data);
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
    const payload = {
      email,
      password: values.password,
    };

    try {
      const data = await loginMutation.mutateAsync(payload);
      const token = extractToken(data);
      const user = extractUser(data);
      const sessionRole = extractRole(data, token, user);
      navigate(getLandingPath(sessionRole), { replace: true });
    } catch (error) {
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
      navigate(getLandingPath(sessionRole), { replace: true });
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
      const data = await forgotPasswordMutation.mutateAsync({ email });
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
      const data = await forgotPasswordMutation.mutateAsync({ email });
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
      const data = await resetPasswordMutation.mutateAsync({
        email,
        code,
        newPassword: values.newPassword,
      });

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
    verifyEmailMutation.isPending ||
    resendVerificationCodeMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;

  const heading = getFlowHeading(flow);

  return (
    <Box className="page-login">
      <Box className="page-login__glow page-login__glow--one" aria-hidden />
      <Box className="page-login__glow page-login__glow--two" aria-hidden />

      <Box className="page-login__shell">
        <Paper className="page-login__panel page-login__panel--info" elevation={0}>
          <Stack spacing={3}>
            <Box className="page-login__badge">
              <StorefrontRoundedIcon fontSize="small" />
              <span>مساحة الإدارة</span>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="overline" className="page-login__eyebrow">
                دخول مرتب
              </Typography>
              <Typography variant="h2" component="h1" className="page-login__title">
                كل ما تحتاجه لإدارة متجرك من مكان واحد
              </Typography>
              <Typography variant="body1" color="text.secondary" className="page-login__lead">
                واجهة هادئة تساعدك على متابعة ما يهمك بسرعة: المنتجات، الطلبات، والعروض اليومية
                بدون تعقيد.
              </Typography>
            </Stack>

            <Box className="page-login__highlights">
              {highlights.map((item) => (
                <Box key={item.title} className="page-login__highlight">
                  <Box className="page-login__highlight-icon" aria-hidden>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" className="page-login__highlight-title">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Stack>
        </Paper>

        <Paper className="page-login__panel page-login__panel--form" elevation={0}>
          <Stack spacing={2.25}>
            <Box>
              <Typography variant="overline" className="page-login__eyebrow">
                {heading.overline}
              </Typography>
              <Typography variant="h4" className="page-login__form-title">
                {heading.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {heading.description}
              </Typography>
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

                <Button type="submit" variant="contained" size="large" disabled={isBusy}>
                  {loginMutation.isPending ? "جارٍ تسجيل الدخول..." : "الدخول إلى حسابي"}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => moveTo(FLOW.FORGOT_PASSWORD)}
                  disabled={isBusy}
                >
                  نسيت أو أريد تغيير كلمة السر
                </Button>

                <Divider />

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button component={RouterLink} to="/market" variant="outlined">
                    العودة إلى السوق
                  </Button>
                  <Button component={RouterLink} to="/auth/register" variant="text">
                    إنشاء حساب جديد
                  </Button>
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
