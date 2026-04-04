import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useAuth from "../../hooks/auth/useAuth.js";
import useAuthStore from "../../store/authStore.js";
import { extractRole, extractToken, extractUser } from "../../utils/authSession.js";
import { getLandingPath } from "../../utils/roles.js";
import { setAuthToken, setStoredAuthRole, setStoredAuthUser } from "../../utils/token.js";

export default function GoogleSuccessCallback() {
  const navigate = useNavigate();
  const { isPlatformUser, role } = useAuth();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        // قراءة البيانات من URL fragment (#token=..., #email=..., etc)
        const fragment = window.location.hash.substring(1); // إزالة # من البداية
        const params = new URLSearchParams(fragment);

        const token = params.get("token");
        const email = params.get("email");
        const firstName = params.get("firstName");
        const lastName = params.get("lastName");

        // التحقق من وجود token
        if (!token || !token.trim()) {
          setError("فشل في استرجاع بيانات الجلسة. الرجاء المحاولة مرة أخرى.");
          setProcessing(false);
          return;
        }

        // بناء كائن user من البيانات المرسلة
        const userData = {
          email: email || "",
          firstName: firstName || "",
          lastName: lastName || "",
        };

        // حفظ token والبيانات في الـ storage بنفس آلية التخزين الحالية
        setAuthToken(token);
        setStoredAuthUser(userData);

        // استخراج role من token إذا كان موجود
        const user = extractUser({ token }, token);
        const sessionRole = extractRole({ token }, token, user);

        if (sessionRole) {
          setStoredAuthRole(sessionRole);
        }

        // تحديث auth store
        setSession({
          token,
          user: userData,
          role: sessionRole || "",
        });

        setProcessing(false);

        // التوجيه للصفحة الرئيسية المناسبة
        const landingPath = getLandingPath(sessionRole || "");
        navigate(landingPath || "/market", { replace: true });
      } catch (err) {
        console.error("[GoogleCallback] Processing error:", err.message);
        setError("حدث خطأ أثناء معالجة جلسة Google. الرجاء المحاولة مرة أخرى.");
        setProcessing(false);
      }
    };

    processGoogleCallback();
  }, [navigate, setSession]);

  // إذا كان المستخدم مسجل دخول بالفعل، وجهه إلى الصفحة الرئيسية
  if (isPlatformUser) {
    return <Navigate to={getLandingPath(role)} replace />;
  }

  if (processing) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            جاري معالجة جلسة Google...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
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
        <Stack spacing={2} sx={{ maxWidth: 400 }}>
          <Alert severity="error">{error}</Alert>
          <Typography variant="body2" color="text.secondary">
            الرجاء العودة لصفحة الدخول والمحاولة مرة أخرى.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return null;
}
