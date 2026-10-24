import { useMemo, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AppButton from "../common/buttons/AppButton.jsx";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { buildOrderInvoice } from "../../utils/orderInvoice.js";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";

export default function OrderInvoiceDialog({ data, store, owner, autoOpen = false }) {
  const { t, locale, dir } = useOwnerLanguage();
  const [open, setOpen] = useState(autoOpen);
  const [ready, setReady] = useState(false);
  const [printing, setPrinting] = useState(false);
  const frame = useRef(null);
  const html = useMemo(() => buildOrderInvoice({ data, store, owner, t, locale, dir }), [data, store, owner, t, locale, dir]);
  async function print() {
    setPrinting(true);
    try {
      const target = frame.current?.contentWindow;
      if (!target) return;
      // A slow logo must not prevent the merchant from printing the invoice.
      let timeout;
      try {
        await Promise.race([
          Promise.all([
            ...[...target.document.images].map(img => img.decode?.().catch(() => {}) ?? Promise.resolve()),
            target.document.fonts?.ready,
          ]),
          new Promise(resolve => { timeout = setTimeout(resolve, 5000); }),
        ]);
      } finally { clearTimeout(timeout); }
      target.focus();
      target.print();
    } finally { setPrinting(false); }
  }
  return <>
    <AppButton variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => { setReady(false); setOpen(true); }}>{t("طباعة الفاتورة")}</AppButton>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg" dir={dir}>
      <DialogTitle>{t("معاينة فاتورة الطلب")}</DialogTitle>
      <DialogContent><iframe ref={frame} title={t("فاتورة الطلب")} srcDoc={html} sandbox="allow-same-origin allow-modals" onLoad={() => setReady(true)} style={{ width: "100%", height: "70vh", border: "1px solid #d8e2e0", background: "white" }} /></DialogContent>
      <DialogActions>
        <AppButton variant="outlined" onClick={() => setOpen(false)}>{t("إغلاق")}</AppButton>
        <AppButton variant="contained" disabled={!ready || printing} onClick={print}>{t("طباعة الفاتورة")}</AppButton>
      </DialogActions>
    </Dialog>
  </>;
}
