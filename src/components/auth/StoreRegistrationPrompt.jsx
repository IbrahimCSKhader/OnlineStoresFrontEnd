import { useEffect, useId, useState } from "react";
import { Link as RouterLink, matchPath, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import StoreGoogleAuthButton from "./StoreGoogleAuthButton.jsx";

function RegistrationDialog({ store, slug, redirectTo, dir, lang, t }) {
  const storageKey = `store-registration-prompt:${store.id}`;
  const titleId = useId();
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) === null;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(storageKey, "seen");
    } catch {
      // The dialog can still be dismissed if the browser blocks persistence.
    }
  }, [open, storageKey]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" aria-labelledby={titleId} dir={dir} lang={lang}>
      <DialogTitle id={titleId}>{t("تسجيل الدخول إلى المتجر")}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          {store.requireCustomerLoginForCheckout === false
            ? t("يمكنك تسجيل الدخول لحفظ بياناتك، أو المتابعة كضيف وإتمام الطلب دون حساب.")
            : t("سجّل الدخول للاستفادة من ميزات المتجر وإتمام الطلب.")}
        </Typography>
        <StoreGoogleAuthButton
          storeId={store.id}
          storeSlug={slug}
          storeName={store.name}
          redirectTo={redirectTo}
          label={t("التسجيل باستخدام Google")}
        />
      </DialogContent>
      <DialogActions>
        <Button component={RouterLink} to={buildStorefrontPath(slug, "/login")} onClick={() => setOpen(false)}>
          {t("تسجيل الدخول")}
        </Button>
        <Button onClick={() => setOpen(false)}>
          {store.requireCustomerLoginForCheckout === false ? t("المتابعة كضيف") : t("ليس الآن")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function StoreRegistrationPrompt({ store, slug, dir, lang, t }) {
  const { pathname, search, hash } = useLocation();
  const { hasScopedStorefrontSession } = useStorefrontSession(store.id, slug);
  const route = pathname.replace(/\/+$/, "").toLowerCase();
  const page = matchPath("/market/:slug/:page", route)?.params.page ?? route.slice(1);
  const isAuthPage = route.startsWith("/auth/") || ["login", "register", "verify-email"].includes(page);

  if (!store.id || hasScopedStorefrontSession || isAuthPage) return null;

  return (
    <RegistrationDialog key={store.id} store={store} slug={slug} redirectTo={`${pathname}${search}${hash}`} dir={dir} lang={lang} t={t} />
  );
}
