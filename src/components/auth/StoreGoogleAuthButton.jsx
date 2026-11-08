import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import axiosInstance from "../../API/axiosInstance.js";
import endpoints from "../../API/endpoints.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { logAuthFlow } from "../../utils/authFlowDebug.js";
import { clearPendingGoogleCallbackResult } from "../../utils/pendingGoogleCallbackResult.js";
import {
  clearPendingGoogleAuthContext,
  setPendingGoogleAuthContext,
} from "../../utils/pendingGoogleAuthContext.js";
import { clearPendingStoreGoogleAuth } from "../../utils/pendingStoreGoogleAuth.js";
import { STORE_CUSTOMER_AUTH_MODE } from "../../utils/storeCustomerAuth.js";
import "./StoreGoogleAuthButton.css";

function GoogleLogoIcon() {
  return (
    <svg
      className="store-google-auth__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.82 12.27c0-.77-.07-1.5-.2-2.2H12v4.17h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.06-4.4 3.06-7.61Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.76 0 5.08-.91 6.77-2.47l-3.3-2.56c-.91.61-2.08.98-3.47.98-2.67 0-4.94-1.8-5.75-4.23H2.84v2.64A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.25 13.72A6.01 6.01 0 0 1 5.92 12c0-.6.11-1.18.31-1.72V7.64H2.84A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.36l3.17-2.64Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.05c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.07 3.04 14.75 2 12 2A10 10 0 0 0 2.84 7.64l3.39 2.64c.81-2.43 3.08-4.23 5.77-4.23Z"
      />
    </svg>
  );
}

export default function StoreGoogleAuthButton({
  storeId,
  storeSlug,
  storeName,
  redirectTo,
  label,
  disabled,
  onPendingChange,
}) {
  const { t } = useStorefrontLanguage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    setPending(true);
    onPendingChange?.(true);

    try {
      clearPendingStoreGoogleAuth();
      clearPendingGoogleCallbackResult();
      clearPendingGoogleAuthContext();
      setPendingGoogleAuthContext({
        authMode: STORE_CUSTOMER_AUTH_MODE,
        storeId,
        storeSlug,
        storeName,
        redirectTo,
      });

      const params = new URLSearchParams({ frontendOrigin: window.location.origin });
      if (storeId) params.set("storeId", storeId);
      if (storeSlug) params.set("storeSlug", storeSlug);
      if (redirectTo) params.set("redirectTo", redirectTo);

      logAuthFlow("Starting Google store login redirect", { storeId, storeSlug, redirectTo });
      const apiBaseUrl = axiosInstance.defaults.baseURL.replace(/\/+$/, "");
      window.location.assign(`${apiBaseUrl}${endpoints.storeCustomerAuth.google}?${params}`);
    } catch {
      clearPendingGoogleCallbackResult();
      clearPendingGoogleAuthContext();
      setError(t("فشل الاتصال بخادم Google. حاول مرة أخرى."));
      setPending(false);
      onPendingChange?.(false);
    }
  }

  return (
    <>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Button
        type="button"
        fullWidth
        variant="outlined"
        size="large"
        className="store-google-auth__button"
        startIcon={<GoogleLogoIcon />}
        onClick={handleClick}
        disabled={disabled || pending || !(storeSlug || storeId)}
      >
        {pending ? t("جارٍ الاتصال بـ Google...") : label}
      </Button>
    </>
  );
}
