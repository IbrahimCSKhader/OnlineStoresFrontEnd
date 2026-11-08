import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Paper, Stack, Switch, TextField, Typography,
} from "@mui/material";
import adminOperations from "../../API/adminOperations.api.js";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog.jsx";
import AdminStatusChip from "../../components/admin/AdminStatusChip.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import { normalizeListResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import "./SuperAdminPages.css";

const planFeatures = [
  ["isActive", "الباقة متاحة"],
  ["canUseOffers", "العروض"],
  ["canUseAdvancedOffers", "العروض المتقدمة"],
  ["canUseCoupons", "كوبونات الخصم"],
  ["canUseAnalytics", "التحليلات"],
  ["canUseCustomDomain", "دومين خاص"],
];

function PlanForm({ plan, onClose, mutation }) {
  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const maxProducts = fields.get("maxProducts");
    const maxImages = fields.get("maxImagesPerProduct");
    const values = {
      name: fields.get("name").trim(),
      code: fields.get("code").trim(),
      description: fields.get("description").trim(),
      currency: fields.get("currency").trim(),
      price: Number(fields.get("price")),
      sortOrder: Number(fields.get("sortOrder")),
      maxProducts: maxProducts === "" ? null : Number(maxProducts),
      maxImagesPerProduct: maxImages === "" ? null : Number(maxImages),
      ...Object.fromEntries(planFeatures.map(([key]) => [key, fields.has(key)])),
    };
    if (plan.id) {
      values.clearMaxProducts = maxProducts === "";
      values.clearMaxImagesPerProduct = maxImages === "";
    }
    mutation.mutate({ id: plan.id, values });
  }

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={mutation.isPending ? undefined : onClose} dir="rtl">
      <DialogTitle>{plan.id ? "تعديل الباقة" : "إنشاء باقة"}</DialogTitle>
      <DialogContent dividers>
        {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{extractApiError(mutation.error, "تعذر حفظ الباقة.")}</Alert>}
        <form id="admin-plan-form" className="super-admin-modal-grid" onSubmit={submit}>
          <TextField required label="اسم الباقة" name="name" defaultValue={plan.name} slotProps={{ htmlInput: { maxLength: 120, pattern: ".*\\S.*" } }} />
          <TextField required label="رمز الباقة" name="code" defaultValue={plan.code} slotProps={{ htmlInput: { maxLength: 60, pattern: ".*\\S.*" } }} />
          <TextField label="الوصف" name="description" multiline defaultValue={plan.description ?? ""} slotProps={{ htmlInput: { maxLength: 600 } }} />
          <TextField required label="السعر" name="price" type="number" defaultValue={plan.price ?? 0} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
          <TextField required label="العملة" name="currency" defaultValue={plan.currency || "USD"} slotProps={{ htmlInput: { maxLength: 10, pattern: ".*\\S.*" } }} />
          <TextField required label="ترتيب العرض" name="sortOrder" type="number" defaultValue={plan.sortOrder ?? 0} slotProps={{ htmlInput: { min: 0, max: 2147483647 } }} />
          <TextField label="حد المنتجات" name="maxProducts" type="number" defaultValue={plan.maxProducts ?? ""} helperText="اتركه فارغًا لعدد غير محدود" slotProps={{ htmlInput: { min: 0, max: 2147483647 } }} />
          <TextField label="حد الصور لكل منتج" name="maxImagesPerProduct" type="number" defaultValue={plan.maxImagesPerProduct ?? ""} helperText="اتركه فارغًا لعدد غير محدود" slotProps={{ htmlInput: { min: 0, max: 2147483647 } }} />
          {planFeatures.map(([key, label]) => (
            <FormControlLabel key={key} label={label} control={<Switch name={key} defaultChecked={plan[key] ?? key === "isActive"} />} />
          ))}
        </form>
      </DialogContent>
      <DialogActions>
        <Button disabled={mutation.isPending} onClick={onClose}>إلغاء</Button>
        <Button disabled={mutation.isPending} variant="contained" type="submit" form="admin-plan-form">حفظ الباقة</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Plans() {
  const { notify } = useOutletContext();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["super-admin", "plans"], queryFn: adminOperations.getPlans });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: ["super-admin", "plans"] }),
    client.invalidateQueries({ queryKey: ["super-admin", "subscriptions"] }),
  ]);
  const save = useMutation({
    mutationFn: ({ id, values }) => adminOperations.savePlan(id, values),
    onSuccess: () => {
      setEditing(null);
      notify({ message: "تم حفظ الباقة." });
      return refresh();
    },
  });
  const remove = useMutation({
    mutationFn: adminOperations.deletePlan,
    onSuccess: () => {
      setDeleting(null);
      notify({ message: "تم حذف الباقة." });
      return refresh();
    },
    onError: (error) => {
      setDeleting(null);
      notify({ severity: "error", message: extractApiError(error, "تعذر حذف الباقة. قد تكون مرتبطة باشتراكات.") });
    },
  });

  const columns = [
    { key: "name", title: "الباقة", render: (plan) => <Stack><strong>{plan.name}</strong><small dir="ltr" style={{ textAlign: "start" }}>{plan.code}</small></Stack> },
    { key: "price", title: "السعر", render: (plan) => <span dir="ltr">{plan.price} {plan.currency}</span> },
    { key: "limits", title: "المنتجات / الصور", render: (plan) => `${plan.maxProducts ?? "بلا حد"} / ${plan.maxImagesPerProduct ?? "بلا حد"}` },
    { key: "status", title: "الحالة", render: (plan) => <AdminStatusChip active={plan.isActive} /> },
    { key: "actions", title: "الإجراءات", render: (plan) => (
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button onClick={() => { save.reset(); setEditing(plan); }}>تعديل</Button>
        <Button color="error" onClick={() => setDeleting(plan)}>حذف</Button>
      </Stack>
    ) },
  ];

  return (
    <Stack className="super-admin-page" spacing={2}>
      <div className="super-admin-page__toolbar">
        <Typography component="h2" variant="h6">باقات الاشتراك</Typography>
        <Button variant="contained" onClick={() => { save.reset(); setEditing({}); }}>إنشاء باقة</Button>
      </div>
      {query.isPending ? <LoadingState /> : query.isError ? (
        <Alert severity="error" action={<Button onClick={() => query.refetch()}>إعادة المحاولة</Button>}>تعذر تحميل الباقات.</Alert>
      ) : (
        <Paper className="super-admin-panel" elevation={0}>
          <AppDataTable columns={columns} rows={normalizeListResponse(query.data)} emptyTitle="لا توجد باقات" />
        </Paper>
      )}
      {editing && <PlanForm plan={editing} mutation={save} onClose={() => setEditing(null)} />}
      <AdminConfirmDialog open={Boolean(deleting)} title="حذف الباقة" description={`هل تريد حذف باقة «${deleting?.name ?? ""}»؟`} confirmLabel="حذف الباقة" confirmColor="error" loading={remove.isPending} onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} />
    </Stack>
  );
}
