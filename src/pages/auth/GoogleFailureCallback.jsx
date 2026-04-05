import { Link as RouterLink, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const ERROR_MESSAGES = {
  missing_token:
    "لم يصل رمز الجلسة من الخادم بعد العودة من Google. حاول تسجيل الدخول مرة أخرى.",
  invalid_hash: "تعذر قراءة بيانات العودة من Google. حاول مرة أخرى.",
  processing_failed:
    "حدث خطأ أثناء إكمال تسجيل الدخول عبر Google. حاول مرة أخرى.",
  access_denied:
    "تم رفض الوصول من Google. امنح الصلاحيات المطلوبة ثم أعد المحاولة.",
  invalid_request: "طلب تسجيل الدخول عبر Google غير صالح أو غير مكتمل.",
  store_context_required:
    "يلزم فتح صفحة متجر محدد قبل تسجيل الدخول عبر Google. ارجع إلى المتجر وحاول مرة أخرى.",
  server_error: "حدث خطأ في الخادم أثناء معالجة تسجيل الدخول عبر Google.",
  temporarily_unavailable: "خدمة تسجيل الدخول عبر Google غير متاحة حاليًا.",
  default: "فشل تسجيل الدخول عبر Google. حاول مرة أخرى من صفحة تسجيل الدخول.",
};

function resolveFailureMessage(searchParams) {
  const rawMessage = searchParams.get("message")?.trim();
  const errorCode = searchParams.get("error")?.trim();

  if (rawMessage && ERROR_MESSAGES[rawMessage]) {
    return ERROR_MESSAGES[rawMessage];
  }

  if (rawMessage) {
    return rawMessage;
  }

  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  return ERROR_MESSAGES.default;
}

export default function GoogleFailureCallback() {
  const [searchParams] = useSearchParams();
  const displayMessage = resolveFailureMessage(searchParams);

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
      <Paper elevation={0} sx={{ maxWidth: 520, width: "100%" }}>
        <Stack spacing={3} sx={{ padding: 4 }}>
          <Box>
            <Typography variant="h5" gutterBottom sx={{ color: "error.main" }}>
              تعذر إكمال تسجيل الدخول عبر Google
            </Typography>
            <Typography variant="body2" color="text.secondary">
              لم يتم إنشاء جلسة دخول صالحة. يمكنك إعادة المحاولة من صفحة تسجيل
              الدخول.
            </Typography>
          </Box>

          <Alert severity="error">{displayMessage}</Alert>

          <Button
            component={RouterLink}
            to="/auth/login"
            variant="contained"
            size="large"
            fullWidth
          >
            إعادة المحاولة
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
