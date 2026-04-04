import { useSearchParams, Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const ERROR_MESSAGES = {
  access_denied: "تم رفض الوصول. لم تعطِ Google الإذن الكافي.",
  invalid_request: "حدث خطأ في الطلب. الرجاء المحاولة مرة أخرى.",
  server_error: "حدث خطأ في الخادم. الرجاء محاولة الاتصال بنا لاحقًا.",
  temporarily_unavailable: "الخدمة غير متاحة حاليًا. الرجاء المحاولة لاحقًا.",
  default: "فشل تسجيل الدخول عبر Google. الرجاء محاولة طريقة أخرى.",
};

export default function GoogleFailureCallback() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error") || "default";
  const errorMessage = searchParams.get("message");

  const displayMessage = errorMessage || ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "background.default",
        padding: 2,
      }}
    >
      <Paper elevation={0} sx={{ maxWidth: 500, width: "100%" }}>
        <Stack spacing={3} sx={{ padding: 4 }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: "error.main" }}>
              فشل تسجيل الدخول عبر Google
            </Typography>
            <Typography variant="body2" color="text.secondary">
              حدث خطأ أثناء محاولة تسجيل الدخول
            </Typography>
          </Box>

          <Alert severity="error">{displayMessage}</Alert>

          <Typography variant="body2" color="text.secondary">
            يمكنك محاولة إحدى الخيارات التالية:
          </Typography>

          <Stack spacing={1.5}>
            <Button
              component={RouterLink}
              to="/auth/login"
              variant="contained"
              size="large"
              fullWidth
            >
              محاولة تسجيل الدخول مجددًا
            </Button>

            <Button
              component={RouterLink}
              to="/auth/register"
              variant="outlined"
              size="large"
              fullWidth
            >
              إنشاء حساب جديد
            </Button>

            <Button
              component={RouterLink}
              to="/market"
              variant="text"
              size="large"
              fullWidth
            >
              العودة إلى السوق
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            إذا استمرت المشكلة، يرجى التواصل معنا للحصول على الدعم.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
