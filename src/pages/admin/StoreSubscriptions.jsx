import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { Alert, Button, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import adminOperations from "../../API/adminOperations.api.js";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import { formatAdminDate } from "../../utils/adminDashboard.js";
import { normalizeListResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import { queryKeys } from "../../utils/queryKeys.js";

const statusLabels = { 1: "نشط", 2: "منتهي", 3: "ملغى", Active: "نشط", Expired: "منتهي", Cancelled: "ملغى" };

export default function StoreSubscriptions({ storeId }) {
  const { notify } = useOutletContext();
  const client = useQueryClient();
  const [planId, setPlanId] = useState("");
  const [cancelled, setCancelled] = useState(null);
  const [formError, setFormError] = useState("");
  const subscriptionsKey = ["super-admin", "subscriptions", storeId];
  const subscriptions = useQuery({ queryKey: subscriptionsKey, queryFn: () => adminOperations.getSubscriptions(storeId) });
  const plans = useQuery({ queryKey: ["super-admin", "plans"], queryFn: adminOperations.getPlans });
  const availablePlans = normalizeListResponse(plans.data).filter((plan) => plan.isActive);
  const selectedPlan = availablePlans.find((plan) => plan.id === planId);

  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: subscriptionsKey }),
    client.invalidateQueries({ queryKey: queryKeys.stores.subscription(storeId) }),
  ]);

  const assign = useMutation({
    mutationFn: adminOperations.assignSubscription,
    onSuccess: () => {
      setPlanId("");
      notify({ message: "تم حفظ اشتراك المتجر." });
      return refresh();
    },
  });
  const cancel = useMutation({
    mutationFn: adminOperations.cancelSubscription,
    onSuccess: () => {
      setCancelled(null);
      notify({ message: "تم إلغاء الاشتراك." });
      return refresh();
    },
    onError: (error) => {
      setCancelled(null);
      notify({ severity: "error", message: extractApiError(error, "تعذر إلغاء الاشتراك.") });
    },
  });

  function submit(event) {
    event.preventDefault();
    if (!selectedPlan || assign.isPending) return;
    const fields = new FormData(event.currentTarget);
    const start = fields.get("startDate");
    const end = fields.get("endDate");
    if (end && new Date(end) <= (start ? new Date(start) : new Date())) {
      setFormError("تاريخ الانتهاء لازم يكون بعد بداية الاشتراك.");
      return;
    }
    setFormError("");
    assign.mutate({
      storeId,
      subscriptionPlanId: planId,
      startDate: start ? new Date(start).toISOString() : null,
      endDate: end ? new Date(end).toISOString() : null,
      paidAmount: Number(fields.get("paidAmount")),
      currency: selectedPlan.currency,
      isAutoRenew: fields.has("isAutoRenew"),
      notes: fields.get("notes").trim(),
    });
  }

  const columns = [
    { key: "planName", title: "الباقة" },
    { key: "status", title: "الحالة", render: ({ status }) => statusLabels[status] ?? "—" },
    { key: "startDate", title: "البداية", render: ({ startDate }) => formatAdminDate(startDate) },
    { key: "endDate", title: "الانتهاء", render: ({ endDate }) => endDate ? formatAdminDate(endDate) : "مفتوح" },
    { key: "paidAmount", title: "المبلغ المسجّل", render: ({ paidAmount, currency }) => <span dir="ltr">{paidAmount} {currency}</span> },
    { key: "actions", title: "الإجراءات", render: (subscription) => statusLabels[subscription.status] === "نشط" ? (
      <Button color="error" disabled={assign.isPending} onClick={() => setCancelled(subscription)}>إلغاء الاشتراك</Button>
    ) : "—" },
  ];

  return (
    <Stack spacing={2}>
      <Paper className="super-admin-panel" elevation={0}>
        <Typography component="h2" variant="h6" gutterBottom>تعيين أو تغيير الباقة</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>تعيين باقة جديدة يستبدل الاشتراك الحالي للمتجر.</Typography>
        {plans.isPending ? <LoadingState /> : plans.isError ? (
          <Alert severity="error" action={<Button onClick={() => plans.refetch()}>إعادة المحاولة</Button>}>تعذر تحميل الباقات.</Alert>
        ) : availablePlans.length === 0 ? <Alert severity="info">لا توجد باقات نشطة.</Alert> : (
          <form key={assign.data?.id ?? "new"} className="super-admin-modal-grid" onSubmit={submit}>
            <TextField select required label="الباقة" value={planId} onChange={(event) => setPlanId(event.target.value)}>
              {availablePlans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>)}
            </TextField>
            <TextField label="المبلغ المسجّل" name="paidAmount" type="number" defaultValue={0} helperText={selectedPlan?.currency} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
            <TextField label="بداية الاشتراك" name="startDate" type="datetime-local" helperText="الفارغ يعني البدء الآن" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="نهاية الاشتراك" name="endDate" type="datetime-local" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="ملاحظات" name="notes" multiline slotProps={{ htmlInput: { maxLength: 1000 } }} />
            <FormControlLabel label="التجديد التلقائي" control={<Switch name="isAutoRenew" />} />
            {(formError || assign.isError) && <Alert severity="error">{formError || extractApiError(assign.error, "تعذر حفظ الاشتراك.")}</Alert>}
            <Button type="submit" variant="contained" disabled={!selectedPlan || assign.isPending || cancel.isPending}>حفظ الاشتراك</Button>
          </form>
        )}
      </Paper>
      <Paper className="super-admin-panel" elevation={0}>
        <Typography component="h2" variant="h6" gutterBottom>سجل الاشتراكات</Typography>
        {subscriptions.isPending ? <LoadingState /> : subscriptions.isError ? (
          <Alert severity="error" action={<Button onClick={() => subscriptions.refetch()}>إعادة المحاولة</Button>}>تعذر تحميل سجل الاشتراكات.</Alert>
        ) : <AppDataTable columns={columns} rows={normalizeListResponse(subscriptions.data)} emptyTitle="لا توجد اشتراكات" />}
      </Paper>
      <AdminConfirmDialog open={Boolean(cancelled)} title="إلغاء الاشتراك" description={`هل تريد إلغاء اشتراك «${cancelled?.planName ?? ""}»؟`} confirmLabel="إلغاء الاشتراك" cancelLabel="تراجع" confirmColor="error" loading={cancel.isPending} onClose={() => setCancelled(null)} onConfirm={() => cancel.mutate(cancelled.id)} />
    </Stack>
  );
}
