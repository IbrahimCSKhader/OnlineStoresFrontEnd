import { useMemo } from "react";
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
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import useAuth from "../../hooks/auth/useAuth.js";
import useRegister from "../../hooks/auth/useRegister.js";
import extractApiError from "../../utils/extractApiError.js";
import { setPendingVerificationEmail } from "../../utils/pendingVerificationEmail.js";
import { getLandingPath } from "../../utils/roles.js";
import "./Register.css";

const benefits = [
  "ابدأ بواجهة واضحة وجاهزة للنمو.",
  "نظّم متجرك ومنتجاتك وعروضك بسهولة.",
  "تجربة عربية أنيقة على الهاتف والكمبيوتر.",
];

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const registerMutation = useRegister();

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

  if (isAuthenticated) {
    return <Navigate to={getLandingPath(role)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      password: values.password,
    };

    const data = await registerMutation.mutateAsync(payload);
    setPendingVerificationEmail(data?.email || payload.email);

    reset(defaultValues);
    navigate("/auth/verify-email", {
      replace: true,
      state: {
        email: data?.email || payload.email,
        message: data?.message || "تم إنشاء الحساب. أدخل كود التحقق لإكمال التفعيل.",
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
              <span>بداية جديدة</span>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="overline" className="page-register__eyebrow">
                حسابك الأول
              </Typography>
              <Typography variant="h2" component="h1" className="page-register__title">
                أنشئ حسابك وابدأ بناء واجهة بيع أنيقة
              </Typography>
              <Typography variant="body1" color="text.secondary" className="page-register__lead">
                خطوات قصيرة تفصلك عن مساحة عمل واضحة تساعدك على إطلاق متجرك وتنسيق تجربته بثقة.
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
          <Stack spacing={2.1} component="form" onSubmit={onSubmit}>
            <Box>
              <Typography variant="overline" className="page-register__eyebrow">
                فتح حساب
              </Typography>
              <Typography variant="h4" className="page-register__form-title">
                بيانات بسيطة لبداية مرتبة
              </Typography>
              <Typography variant="body2" color="text.secondary">
                أدخل معلوماتك الأساسية، وبعدها نوجّهك مباشرة إلى شاشة التحقق من البريد الإلكتروني.
              </Typography>
            </Box>

            {registerMutation.isError ? (
              <Alert severity="error">
                {extractApiError(registerMutation.error, "تعذّر إنشاء الحساب الآن. حاول مرة أخرى.")}
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
              <Button component={RouterLink} to="/auth/login" variant="outlined">
                لدي حساب بالفعل
              </Button>
              <Button component={RouterLink} to="/market" variant="text">
                متابعة التصفح
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
