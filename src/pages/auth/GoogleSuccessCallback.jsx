import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function GoogleSuccessCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash.startsWith("#")
      ? location.hash.substring(1)
      : location.hash;

    const params = new URLSearchParams(hash);

    const token = params.get("token");

    if (!token) {
      navigate("/auth/login");
      return;
    }

    localStorage.setItem("token", token);

    window.history.replaceState(
      window.history.state,
      document.title,
      `${window.location.pathname}`,
    );

    window.location.href = "/";
  }, [location, navigate]);

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
      <Stack spacing={2} alignItems="center">
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          جارٍ إكمال تسجيل الدخول عبر Google...
        </Typography>
      </Stack>
    </Box>
  );
}
