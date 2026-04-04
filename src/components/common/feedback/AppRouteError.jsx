import { Link as RouterLink, isRouteErrorResponse, useRouteError } from "react-router-dom";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AppButton from "../buttons/AppButton.jsx";
import EmptyState from "./EmptyState.jsx";
import Header from "../../layout/Header/Header.jsx";
import Footer from "../../layout/Footer.jsx";
import "../../../layout/MainLayout.css";

function isDynamicImportError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("error loading dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("dynamically imported module")
  );
}

function resolveErrorCopy(error) {
  if (isDynamicImportError(error)) {
    return {
      title: "تم نشر نسخة جديدة من المنصة",
      description:
        "تعذر تحميل جزء من الصفحة لأن المتصفح يحاول فتح ملف قديم من النسخة السابقة. حدّث الصفحة وسيتم تحميل النسخة الجديدة.",
    };
  }

  if (isRouteErrorResponse(error) && error.status === 404) {
    return {
      title: "الصفحة غير موجودة",
      description: "الرابط المطلوب غير متاح أو تم نقله.",
    };
  }

  return {
    title: "حدث خطأ غير متوقع",
    description: "يمكنك إعادة تحميل الصفحة أو العودة للرئيسية ثم المحاولة مرة أخرى.",
  };
}

export default function AppRouteError() {
  const error = useRouteError();
  const copy = resolveErrorCopy(error);

  return (
    <Box className="main-layout">
      <Header />
      <Box component="main" className="main-layout__content">
        <Box className="storefront-page">
          <EmptyState
            title={copy.title}
            description={copy.description}
            action={
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
                <AppButton variant="contained" onClick={() => window.location.reload()}>
                  تحديث الصفحة
                </AppButton>
                <AppButton component={RouterLink} to="/" variant="outlined">
                  العودة للرئيسية
                </AppButton>
              </Stack>
            }
          />
        </Box>
      </Box>
      <Box className="main-layout__footer">
        <Footer />
      </Box>
    </Box>
  );
}
