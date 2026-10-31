import { useMemo, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AppButton from "../common/buttons/AppButton.jsx";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { buildOrderInvoice } from "../../utils/orderInvoice.js";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";

export default function OrderInvoiceDialog({ data, store, owner, autoOpen = false, onPrint }) {
  const { t, locale, dir } = useOwnerLanguage();
  const [open, setOpen] = useState(autoOpen);
  const [ready, setReady] = useState(false);
  const [showProductImages, setShowProductImages] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [recordError, setRecordError] = useState(false);
  const pendingPrint = useRef(null);
  const busy = useRef(false);
  const frame = useRef(null);
  const html = useMemo(() => buildOrderInvoice({ data, store, owner, t, locale, dir, showProductImages }), [data, store, owner, t, locale, dir, showProductImages]);
  async function saveAttempt() {
    if (!pendingPrint.current || !onPrint) return;
    try {
      await onPrint(pendingPrint.current);
      pendingPrint.current = null;
      setRecordError(false);
    } catch { setRecordError(true); }
  }
  async function print() {
    if (busy.current || pendingPrint.current) return;
    busy.current = true;
    setPrinting(true);
    try {
      const target = frame.current?.contentWindow;
      if (!target) return;
      // Slow images must not prevent the merchant from printing the invoice.
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
      if (onPrint) {
        pendingPrint.current = crypto.randomUUID();
        await saveAttempt();
      }
    } finally { setPrinting(false); busy.current = false; }
  }
  return <>
    <AppButton variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => { setReady(false); setOpen(true); }}>{t("طباعة الفاتورة")}</AppButton>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg" dir={dir}>
      <DialogTitle>{t("معاينة فاتورة الطلب")}</DialogTitle>
      {recordError && <Alert severity="warning" action={<AppButton disabled={printing} onClick={async () => { setPrinting(true); try { await saveAttempt(); } finally { setPrinting(false); } }}>{t("إعادة حفظ المحاولة")}</AppButton>}>{t("تم فتح الطباعة، لكن تعذر حفظ العداد. أعد حفظ المحاولة دون طباعة جديدة.")}</Alert>}
      <DialogContent>
        <FormControlLabel label={t("طباعة صور المنتجات")} control={<Checkbox
          checked={showProductImages} disabled={printing || recordError}
          onChange={event => { setReady(false); setShowProductImages(event.target.checked); }}
        />} />
        <iframe ref={frame} title={t("فاتورة الطلب")} srcDoc={html} sandbox="allow-same-origin allow-modals" onLoad={() => setReady(true)} style={{ width: "100%", height: "70vh", border: "1px solid #d8e2e0", background: "white" }} /></DialogContent>
      <DialogActions>
        <AppButton variant="outlined" onClick={() => setOpen(false)}>{t("إغلاق")}</AppButton>
        <AppButton variant="contained" disabled={!ready || printing || recordError} onClick={print}>{t("طباعة الفاتورة")}</AppButton>
      </DialogActions>
    </Dialog>
  </>;
}
