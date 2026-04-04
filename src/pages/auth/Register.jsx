import { useMemo } from "react";
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
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import useAuth from "../../hooks/auth/useAuth.js";
import useStoreCustomerRegister from "../../hooks/auth/useStoreCustomerRegister.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import { setPendingVerificationEmail } from "../../utils/pendingVerificationEmail.js";
import {
  buildStoreCustomerAuthState,
  getStoreCustomerRedirectPath,
  hasStoreCustomerAuthContext,
} from "../../utils/storeCustomerAuth.js";
import "./Register.css";

const benefits = [
  "الحساب هنا يخص هذا المتجر فقط وليس المنصة كلها.",
  "سيصلك كود تحقق على البريد قبل تفعيل الحساب والدخول.",
  "يمكنك استخدام نفس البريد في متجر آخر بحساب منفصل إذا لزم.",
];

export default function Register() {
  const navigate = useNavigate();
  const { slug: routeStoreSlug = "" } = useParams();
  const location = useLocation();
  const { isStoreCustomer } = useAuth();
  const registerMutation = useStoreCustomerRegister();
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
  const redirectTo = getStoreCustomerRedirectPath(storeCustomerAuthState);
  const storeLabel =
    storeCustomerAuthState?.storeName ||
    storeCustomerAuthState?.storeSlug ||
    "هذا المتجر";
  const storeHomePath =
    storeCustomerAuthState?.storeSlug
      ? `/market/${storeCustomerAuthState.storeSlug}`
      : "/market";
  const storeLoginPath =
    storeCustomerAuthState?.storeSlug
      ? `/market/${storeCustomerAuthState.storeSlug}/login`
      : "/auth/login";
  const storeVerifyEmailPath =
    storeCustomerAuthState?.storeSlug
      ? `/market/${storeCustomerAuthState.storeSlug}/verify-email`
      : "/auth/verify-email";

  const defaultValues = useMemo(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    }),
    [],
  );

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  if (isStoreCustomer) {
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!storeCustomerAuthState?.storeId) {
      return;
    }

    const email = values.email.trim();
    const data = await registerMutation.mutateAsync({
      storeId: storeCustomerAuthState.storeId,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email,
      password: values.password,
    });

    const verifiedEmail = data?.email || email;
    setPendingVerificationEmail(verifiedEmail);
    reset(defaultValues);
    navigate(storeVerifyEmailPath, {
      replace: true,
      state: {
        ...storeCustomerAuthState,
        email: verifiedEmail,
        redirectTo,
        message:
          data?.message ||
          "تم إنشاء الحساب. أدخل كود التحقق الذي وصلك على البريد لتفعيل حسابك داخل المتجر.",
      },
    });
  });

  return (
    <Box className="page-register">
      <Box className="page-register__glow page-register__glow--one" aria-hidden />
      <Box className="page-register__glow page-register__glow--two" aria-hidden />

      <Box className="page-register__shell">
        <Paper className="page-register__panel page-register__panel--info" elevation={0}>
          <Stack spacing={3}>
            <Box className="page-register__badge">
              <StorefrontRoundedIcon fontSize="small" />
              <span>عميل متجر</span>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="overline" className="page-register__eyebrow">
                حساب جديد
              </Typography>
              <Typography variant="h2" component="h1" className="page-register__title">
                أنشئ حسابك داخل {storeLabel}
              </Typography>
              <Typography variant="body1" color="text.secondary" className="page-register__lead">
                هذا التسجيل مخصص لعميل المتجر، وبعده سنطلب منك تأكيد البريد الإلكتروني
                بكود تحقق قبل تفعيل الحساب.
              </Typography>
            </Stack>

            <Box className="page-register__benefits">
              {benefits.map((item) => (
                <Box key={item} className="page-register__benefit">
                  <span className="page-register__benefit-dot" aria-hidden />
                  <Typography variant="body2">{item}</Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        </Paper>

        <Paper className="page-register__panel page-register__panel--form" elevation={0}>
          {!storeCustomerAuthState?.storeId ? (
            <Stack spacing={2.1}>
              <Box>
                <Typography variant="overline" className="page-register__eyebrow">
                  اختر متجرًا أولًا
                </Typography>
                <Typography variant="h4" className="page-register__form-title">
                  لا يمكن إنشاء عميل متجر بدون سياق متجر
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  افتح صفحة المتجر المطلوب أولًا، ثم ابدأ إنشاء الحساب من هناك حتى نربطه
                  بالمتجر الصحيح.
                </Typography>
              </Box>

              <Alert severity="info">
                تسجيل عميل المتجر يعتمد على <code>StoreId</code> الخاص بالمتجر الحالي.
              </Alert>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button component={RouterLink} to={storeHomePath} variant="contained">
                  الذهاب إلى المتاجر
                </Button>
                <Button component={RouterLink} to={storeLoginPath} variant="outlined">
                  تسجيل الدخول
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2.1} component="form" onSubmit={onSubmit}>
              <Box>
                <Typography variant="overline" className="page-register__eyebrow">
                  فتح حساب
                </Typography>
                <Typography variant="h4" className="page-register__form-title">
                  بيانات بسيطة لبداية مرتبة
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  أنشئ حسابك كعميل داخل {storeLabel} ثم أكمل التفعيل عبر كود التحقق الذي
                  سيصلك على البريد.
                </Typography>
              </Box>

              {registerMutation.isError ? (
                <Alert severity="error">
                  {extractApiError(
                    registerMutation.error,
                    "تعذر إنشاء الحساب الآن. حاول مرة أخرى.",
                  )}
                </Alert>
              ) : null}

              <Box className="page-register__grid">
                <TextField
                  label="الاسم الأول"
                  placeholder="مثال: إبراهيم"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("firstName", {
                    required: "الاسم الأول مطلوب",
                    minLength: {
                      value: 2,
                      message: "الاسم الأول يجب أن يكون حرفين على الأقل",
                    },
                  })}
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName?.message}
                />

                <TextField
                  label="اسم العائلة"
                  placeholder="مثال: خالد"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("lastName", {
                    required: "اسم العائلة مطلوب",
                    minLength: {
                      value: 2,
                      message: "اسم العائلة يجب أن يكون حرفين على الأقل",
                    },
                  })}
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName?.message}
                />

                <TextField
                  label="البريد الإلكتروني"
                  placeholder="name@example.com"
                  type="email"
                  fullWidth
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
                      message: "أدخل بريدًا إلكترونيًا صحيحًا",
                    },
                  })}
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />
              </Box>

              <Box className="page-register__grid">
                <TextField
                  label="كلمة المرور"
                  type="password"
                  fullWidth
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
                      value: 8,
                      message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
                    },
                  })}
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                />

                <TextField
                  label="تأكيد كلمة المرور"
                  type="password"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  {...register("confirmPassword", {
                    required: "أعد كتابة كلمة المرور",
                    validate: (value) =>
                      value === getValues("password") || "كلمتا المرور غير متطابقتين",
                  })}
                  error={Boolean(errors.confirmPassword)}
                  helperText={errors.confirmPassword?.message}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
              </Button>

              <Divider />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  component={RouterLink}
                  to={storeLoginPath}
                  state={storeCustomerAuthState}
                  variant="outlined"
                >
                  لدي حساب بالفعل
                </Button>
                <Button component={RouterLink} to={storeHomePath} variant="text">
                  العودة إلى المتجر
                </Button>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
