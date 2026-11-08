import { Link as RouterLink, Navigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { SITE_BRAND_ASSET_PATH } from "../../constants/siteBranding.js";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useSuperAdminLogin from "../../hooks/superAdmin/useSuperAdminLogin.js";
import extractApiError from "../../utils/extractApiError.js";
import { isSuperAdminRole } from "../../utils/roles.js";
import "./AdminLogin.css";

function getLoginErrorMessage(error) {
  const status = Number(error?.response?.status || 0);

  if (status === 401 && error?.response?.data?.requiresEmailVerification) {
    return error?.response?.data?.message || "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.";
  }

  if (error?.code === "NOT_SUPERADMIN" || status === 403) {
    return "الدخول مخصص لحساب الإدارة المعتمد.";
  }

  if (status === 404) return "خدمة الدخول الخاص غير متاحة على الخادم الحالي.";

  return extractApiError(error, "تعذر تسجيل الدخول. تأكد من البيانات ثم حاول مرة أخرى.");
}

export default function AdminLogin() {
  const location = useLocation();
  const { isPlatformAuthenticated, platformRole } = useAuth();
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

  if (isPlatformAuthenticated && isSuperAdminRole(platformRole)) {
    const requestedPath = location.state?.redirectTo;
    const redirectTo = typeof requestedPath === "string" && /^\/dashboard(?:[/?#]|$)/.test(requestedPath)
      ? requestedPath
      : "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate({ email: values.email.trim(), password: values.password });
  });

  return (
    <Box className="admin-login" dir="rtl">
      <meta name="robots" content="noindex, nofollow" />
      <Box className="admin-login__orb admin-login__orb--one" aria-hidden />
      <Box className="admin-login__orb admin-login__orb--two" aria-hidden />

      <Box className="admin-login__shell">
        <Paper className="admin-login__panel admin-login__panel--brand" elevation={0}>
          <Stack spacing={2.25}>
            <Box className="admin-login__badge">
              <ShieldRoundedIcon fontSize="small" />
              <span>وصول خاص</span>
            </Box>

            <Box>
              <Typography variant="overline" className="admin-login__eyebrow">
                موجة للأعمال
              </Typography>
              <Typography variant="h2" component="h1" className="admin-login__title">
                مركز إدارة موجة
              </Typography>
            </Box>

            <Typography variant="body1" className="admin-login__lead">
              المتاجر والملاك والطلبات والاشتراكات في مساحة إدارة واحدة.
            </Typography>

            <Stack spacing={1.2} className="admin-login__notes">
              <Typography variant="body2">المتاجر والواجهة</Typography>
              <Typography variant="body2">الحسابات والصلاحيات</Typography>
              <Typography variant="body2">الاشتراكات والصيانة</Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper className="admin-login__panel admin-login__panel--form" elevation={0}>
          <Stack spacing={2.25} component="form" onSubmit={onSubmit}>
            <Box>
              <img className="admin-login__logo" src={SITE_BRAND_ASSET_PATH} alt="موجة" />
              <Typography variant="overline" className="admin-login__eyebrow">
                تسجيل الدخول
              </Typography>
              <Typography variant="h4" className="admin-login__form-title">
                دخول مدير المنصة
              </Typography>
              <Typography variant="body2" color="text.secondary">
                أدخل بيانات حساب الإدارة المعتمد.
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
              <Link component={RouterLink} to="/auth/login" underline="hover">
                تسجيل دخول أصحاب المتاجر
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
