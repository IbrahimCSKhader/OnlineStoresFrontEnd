import { useMemo, useState } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import useAuth from "../../hooks/auth/useAuth.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import extractApiError from "../../utils/extractApiError.js";
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  setPendingVerificationEmail,
} from "../../utils/pendingVerificationEmail.js";
import { getLandingPath } from "../../utils/roles.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "../../utils/token.js";
import "./Login.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);

  const verifyEmailMutation = useVerifyEmail();
  const resendVerificationCodeMutation = useResendVerificationCode();
  const [localError, setLocalError] = useState("");

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

  if (isAuthenticated) {
    return <Navigate to={getLandingPath(role)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setLocalError("");

    const payload = {
      email: values.email.trim(),
      code: values.code.trim(),
    };

    if (!payload.email) {
      setLocalError("أدخل البريد الإلكتروني أولًا.");
      return;
    }

    setPendingVerificationEmail(payload.email);

    const data = await verifyEmailMutation.mutateAsync(payload);

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

    clearPendingVerificationEmail();
    navigate(getLandingPath(resolvedRole), { replace: true });
  });

  const onResendCode = async () => {
    setLocalError("");
    const email = getValues("email")?.trim();

    if (!email) {
      resendVerificationCodeMutation.reset();
      setLocalError("أدخل البريد الإلكتروني أولًا.");
      return;
    }

    setPendingVerificationEmail(email);
    await resendVerificationCodeMutation.mutateAsync({ email });
  };

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
                {location.state?.message || "أدخل الكود الذي وصلك على البريد الإلكتروني."}
              </Typography>
            </Box>

            {verifyEmailMutation.isError ? (
              <Alert severity="error">
                {extractApiError(verifyEmailMutation.error, "تعذّر التحقق من البريد.")}
              </Alert>
            ) : null}

            {localError ? <Alert severity="error">{localError}</Alert> : null}

            {resendVerificationCodeMutation.isSuccess ? (
              <Alert severity="success">
                {resendVerificationCodeMutation.data?.message || "تم إرسال كود تحقق جديد."}
              </Alert>
            ) : null}

            {resendVerificationCodeMutation.isError ? (
              <Alert severity="error">
                {extractApiError(resendVerificationCodeMutation.error, "تعذّر إرسال كود جديد.")}
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
                {resendVerificationCodeMutation.isPending ? "جارٍ الإرسال..." : "إعادة إرسال الكود"}
              </Button>
              <Button component={RouterLink} to="/auth/login" variant="text">
                رجوع لتسجيل الدخول
              </Button>
            </Stack>

            <Divider />

            <Button component={RouterLink} to="/auth/register" variant="text">
              إنشاء حساب جديد
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
