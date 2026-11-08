import { useEffect, useId, useState } from "react";
import { matchPath, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
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
      <DialogTitle id={titleId}>{t("سجل حسابك بضغطة زر للاستفادة من الميزات")}</DialogTitle>
      <DialogContent>
        <StoreGoogleAuthButton
          storeId={store.id}
          storeSlug={slug}
          storeName={store.name}
          redirectTo={redirectTo}
          label={t("التسجيل باستخدام Google")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>{t("ليس الآن")}</Button>
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
