import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import adminOperations from "../../API/adminOperations.api.js";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog.jsx";
import extractApiError from "../../utils/extractApiError.js";
import "./SuperAdminPages.css";

export default function SystemMaintenance() {
  const [confirm, setConfirm] = useState(false);
  const ensure = useMutation({ mutationFn: adminOperations.ensureVariantFolders });
  const clean = useMutation({ mutationFn: adminOperations.cleanEmptyFolders, onSettled: () => setConfirm(false) });
  const busy = ensure.isPending || clean.isPending;

  return (
    <div className="super-admin-quick-grid">
      <Paper className="super-admin-quick-card" elevation={0}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6">مجلدات صور المتغيرات</Typography>
          <Typography color="text.secondary">جهّز المجلدات الناقصة لصور المنتجات ومتغيراتها.</Typography>
          <Button variant="contained" disabled={busy} onClick={() => ensure.mutate()}>
            {ensure.isPending ? "جارٍ التجهيز..." : "تجهيز المجلدات"}
          </Button>
          {ensure.isError && <Alert severity="error">{extractApiError(ensure.error, "تعذر تجهيز المجلدات.")}</Alert>}
          {ensure.isSuccess && <Alert severity={ensure.data.errors?.length ? "warning" : "success"}>المجلدات المنشأة {ensure.data.foldersCreated} · الموجودة مسبقًا {ensure.data.foldersAlreadyExisted} · الأخطاء {ensure.data.errors?.length ?? 0}</Alert>}
        </Stack>
      </Paper>
      <Paper className="super-admin-quick-card" elevation={0}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h6">المجلدات الفارغة</Typography>
          <Typography color="text.secondary">افحص مجلدات الصور الفارغة، ثم احذف المجلدات المؤهلة للتنظيف.</Typography>
          <Button variant="outlined" disabled={busy} onClick={() => clean.mutate(true)}>
            {clean.isPending ? "جارٍ المعالجة..." : "فحص المجلدات"}
          </Button>
          {clean.isError && <Alert severity="error">{extractApiError(clean.error, "تعذر تنفيذ العملية.")}</Alert>}
          {clean.isSuccess && (
            <Alert severity={clean.data.errors?.length ? "warning" : "success"}>
              {clean.data.dryRun ? `مجلدات قابلة للحذف ${clean.data.foldersWouldBeDeleted}` : `مجلدات تم حذفها ${clean.data.foldersDeleted}`}
              {" · الأخطاء "}{clean.data.errors?.length ?? 0}
            </Alert>
          )}
          {clean.isSuccess && clean.data.dryRun && clean.data.foldersWouldBeDeleted > 0 && (
            <Button color="error" disabled={busy} onClick={() => setConfirm(true)}>حذف المجلدات الفارغة</Button>
          )}
        </Stack>
      </Paper>
      <AdminConfirmDialog open={confirm} title="حذف المجلدات الفارغة" description="سيعيد الخادم الفحص ويحذف مجلدات الصور التي ما زالت فارغة ومؤهلة للتنظيف." confirmLabel="حذف" confirmColor="error" loading={clean.isPending} onClose={() => setConfirm(false)} onConfirm={() => clean.mutate(false)} />
    </div>
  );
}
