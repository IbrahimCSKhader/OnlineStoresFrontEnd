import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useSuperAdminLogin from "../../hooks/superAdmin/useSuperAdminLogin.js";
import extractApiError from "../../utils/extractApiError.js";
import { getLandingPath, isSuperAdminRole } from "../../utils/roles.js";
import "./AdminLogin.css";

function getLoginErrorMessage(error) {
  const status = Number(error?.response?.status || 0);

  if (status === 401 && error?.response?.data?.requiresEmailVerification) {
    return error?.response?.data?.message || "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.";
  }

  if (error?.code === "NOT_SUPERADMIN") {
    return "هذا الحساب لا يملك صلاحية الدخول إلى لوحة السوبر أدمن.";
  }

  return extractApiError(error, "تعذر تسجيل الدخول. تأكد من البيانات ثم حاول مرة أخرى.");
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, user } = useAuth();
  const loginMutation = useSuperAdminLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const effectiveRole = role || user?.accountType;

  if (isAuthenticated && isSuperAdminRole(effectiveRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={getLandingPath(effectiveRole)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await loginMutation.mutateAsync({
      email: values.email.trim(),
      password: values.password,
    });

    const redirectTo =
      location.state?.redirectTo && String(location.state.redirectTo).startsWith("/dashboard")
        ? location.state.redirectTo
        : "/dashboard";

    navigate(redirectTo, { replace: true, state: { email: result?.data?.email || values.email } });
  });

  return (
    <Box className="admin-login" dir="rtl">
      <Box className="admin-login__orb admin-login__orb--one" aria-hidden />
      <Box className="admin-login__orb admin-login__orb--two" aria-hidden />

      <Box className="admin-login__shell">
        <Paper className="admin-login__panel admin-login__panel--brand" elevation={0}>
          <Stack spacing={2.25}>
            <Box className="admin-login__badge">
              <ShieldRoundedIcon fontSize="small" />
              <span>وصول السوبر أدمن</span>
            </Box>

            <Box>
              <Typography variant="overline" className="admin-login__eyebrow">
                إدارة المنصة
              </Typography>
              <Typography variant="h2" className="admin-login__title">
                راقب الملاك والمتاجر وعملاء المتاجر من لوحة واحدة.
              </Typography>
            </Box>

            <Typography variant="body1" color="text.secondary" className="admin-login__lead">
              هذا المسار مخصص فقط للحسابات التي تحمل دور <strong>SuperAdmin</strong>. مالك
              المتجر يواصل استخدام صفحة الدخول العامة.
            </Typography>

            <Stack spacing={1.2} className="admin-login__notes">
              <Typography variant="body2">بطاقات إحصائية سريعة للمنصة كاملة</Typography>
              <Typography variant="body2">إدارة الملاك وتفعيلهم وتغيير كلمات المرور</Typography>
              <Typography variant="body2">تفاصيل المتاجر والعملاء وحسابات التواصل</Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper className="admin-login__panel admin-login__panel--form" elevation={0}>
          <Stack spacing={2.25} component="form" onSubmit={onSubmit}>
            <Box>
              <Typography variant="overline" className="admin-login__eyebrow">
                تسجيل الدخول
              </Typography>
              <Typography variant="h4" className="admin-login__form-title">
                دخول السوبر أدمن
              </Typography>
              <Typography variant="body2" color="text.secondary">
                نستخدم نفس endpoint الخلفي، لكن لن يدخل اللوحة إلا الحساب الذي يحمل صلاحية
                السوبر أدمن.
              </Typography>
            </Box>

            {loginMutation.isError ? (
              <Alert severity="error">{getLoginErrorMessage(loginMutation.error)}</Alert>
            ) : null}

            <AppTextField
              label="البريد الإلكتروني"
              type="email"
              autoComplete="email"
              {...register("email", {
                required: "البريد الإلكتروني مطلوب.",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "أدخل بريدًا إلكترونيًا صحيحًا.",
                },
              })}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />

            <AppTextField
              label="كلمة المرور"
              type="password"
              autoComplete="current-password"
              {...register("password", {
                required: "كلمة المرور مطلوبة.",
                minLength: {
                  value: 6,
                  message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
                },
              })}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
            />

            <AppButton type="submit" loading={loginMutation.isPending} size="large">
              دخول إلى اللوحة
            </AppButton>

            <Typography variant="body2" color="text.secondary">
              تريد بوابة مالك المتجر بدلًا من ذلك؟{" "}
              <Link component={RouterLink} to="/auth/login" underline="hover">
                افتح تسجيل الدخول العادي
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
