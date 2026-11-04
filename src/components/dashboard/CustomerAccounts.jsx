import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogTitle, DialogContent, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { customerAccountApi as api } from "../../API/customerAccount.api.js";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import extractApiError from "../../utils/extractApiError.js";
import { queryKeys } from "../../utils/queryKeys.js";

const emptyProfile = { firstName: "", lastName: "", phone: "", address: "", city: "", hasSharedPhone: false };
const statusLabels = { paid: "مدفوع بالكامل", partial: "دفعة جزئية", unpaid: "غير مدفوع", credit: "رصيد دائن" };
const kindLabels = { OrderCharge: "قيمة الطلب / تعديل", Payment: "دفعة مستلمة", Refund: "استرداد للعميل", Reversal: "عكس حركة", OpeningReceipt: "استلام سابق", ReceiptCorrection: "تصحيح الاستلام", Allocation: "توزيع الرصيد" };
function ErrorMessage({ error }) { return error ? <Alert severity="error">{extractApiError(error, "تعذر حفظ البيانات")}</Alert> : null; }
function useRefresh(storeId) {
  const client = useQueryClient();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: ["customerAccounts", storeId] }),
    client.invalidateQueries({ queryKey: queryKeys.orders.byStore(storeId) }),
    client.invalidateQueries({ queryKey: ["orders"] }),
    client.invalidateQueries({ queryKey: queryKeys.customerStores.byStore(storeId) }),
  ]);
}

function ProfileForm({ storeId, customer, onClose }) {
  const { t } = useOwnerLanguage();
  const [form, setForm] = useState(customer || emptyProfile);
  const refresh = useRefresh(storeId);
  const save = useMutation({ mutationFn: () => api.save(storeId, customer?.id, form), onSuccess: async () => { await refresh(); onClose(); } });
  return <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={e => { e.preventDefault(); save.mutate(); }}>
    {[["firstName", "الاسم الأول", 100], ["lastName", "اسم العائلة", 100], ["phone", "الهاتف", 50], ["address", "العنوان", 300], ["city", "المدينة", 100]].map(([key, label, maxLength]) =>
      <TextField key={key} label={t(label)} value={form[key] || ""} required={key === "firstName"} slotProps={{ htmlInput: { maxLength } }} onChange={e => setForm({ ...form, [key]: e.target.value })} />)}
    <FormControlLabel control={<Checkbox checked={!!form.hasSharedPhone} onChange={e => setForm({ ...form, hasSharedPhone: e.target.checked })} />} label={t("رقم هاتف مشترك — مراجعة الربط يدوياً")} />
    <ErrorMessage error={save.error} />
    <Button type="submit" variant="contained" disabled={save.isPending}>{t("حفظ العميل")}</Button>
  </Stack>;
}

export function CustomerDirectory({ storeId }) {
  const { t } = useOwnerLanguage();
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [create, setCreate] = useState(false);
  const refresh = useRefresh(storeId);
  const query = useQuery({ queryKey: ["customerAccounts", storeId, "list", search, page], queryFn: () => api.list(storeId, search, page), enabled: !!storeId });
  const backfill = useMutation({ mutationFn: () => api.backfill(storeId), onSuccess: refresh });
  return <Paper className="owner-panel" elevation={0} sx={{ mb: 3 }}>
    <Stack spacing={2}>
      <Typography variant="h5">{t("العملاء وحساباتهم")}</Typography>
      <Typography color="text.secondary">{t("ملفات موحدة لطلبات الزوار والعملاء المسجلين، دون الحاجة إلى إنشاء حساب دخول.")}</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button variant="contained" onClick={() => setCreate(true)}>{t("إضافة عميل")}</Button>
        <Button variant="outlined" disabled={backfill.isPending} onClick={() => backfill.mutate()}>{t("ربط الطلبات السابقة")}</Button>
      </Stack>
      {backfill.data && <Alert severity="success">{t("تمت معالجة")}: {backfill.data.processed} — {t("طلبات متبقية")}: {backfill.data.remaining}{backfill.data.remaining > 0 ? t(". اضغط مجدداً لمعالجة الدفعة التالية.") : ""}</Alert>}
      <ErrorMessage error={query.error || backfill.error} />
      <TextField label={t("بحث بالاسم أو الهاتف")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      {query.isLoading ? <Typography>{t("جارٍ التحميل...")}</Typography> : query.data?.items?.length === 0 ? <Typography>{t("لا يوجد عملاء مطابقون")}</Typography> : null}
      {query.data?.items?.map(customer => <Box key={customer.id} className="owner-detail-list-item" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Box><Typography component={Link} to={`/owner/customers/${customer.id}`}>{customer.firstName} {customer.lastName}</Typography><Typography variant="body2" dir="ltr">{customer.phone || "—"}</Typography></Box>
        <Chip size="small" label={t(customer.hasSharedPhone ? "هاتف مشترك" : customer.isGuestProfile ? "عميل دون تسجيل" : "عميل مسجل")} />
      </Box>)}
      <Stack direction="row" spacing={2} alignItems="center"><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("السابق")}</Button><Typography>{page}</Typography><Button disabled={page * 50 >= (query.data?.total || 0)} onClick={() => setPage(page + 1)}>{t("التالي")}</Button></Stack>
    </Stack>
    <Dialog open={create} onClose={() => setCreate(false)} fullWidth maxWidth="sm"><DialogTitle>{t("إضافة عميل")}</DialogTitle><DialogContent><ProfileForm storeId={storeId} onClose={() => setCreate(false)} /></DialogContent></Dialog>
  </Paper>;
}

function CustomerPicker({ storeId, value, onChange, exclude }) {
  const { t } = useOwnerLanguage(); const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["customerAccounts", storeId, "pick", search], queryFn: () => api.list(storeId, search), enabled: !!storeId });
  return <Stack spacing={1}><TextField label={t("بحث عن العميل بالاسم أو الهاتف")} value={search} onChange={e => { setSearch(e.target.value); onChange(""); }} />
    <TextField select required label={t("العميل")} value={value} onChange={e => onChange(e.target.value)}><MenuItem value="">—</MenuItem>{query.data?.items?.filter(c => c.id !== exclude).map(c => <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone || "—"}</MenuItem>)}</TextField><ErrorMessage error={query.error} /></Stack>;
}

export function CustomerAccount({ storeId, customerId, orderId }) {
  const navigate = useNavigate();
  const { t, currency, dateTime } = useOwnerLanguage(); const refresh = useRefresh(storeId);
  const query = useQuery({ queryKey: ["customerAccounts", storeId, customerId], queryFn: () => api.account(storeId, customerId), enabled: !!storeId && !!customerId });
  const [dialog, setDialog] = useState(""); const [reason, setReason] = useState(""); const [target, setTarget] = useState(""); const [entryId, setEntryId] = useState("");
  const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); const [method, setMethod] = useState("نقدي"); const [notes, setNotes] = useState("");
  const [allocations, setAllocations] = useState({}); const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [clientError, setClientError] = useState("");
  const action = useMutation({ mutationFn: async () => {
    if (dialog === "merge") return api.merge(storeId, customerId, target, reason);
    if (dialog === "reverse") return api.reverse(storeId, customerId, entryId, reason);
    const rows = Object.entries(allocations).filter(([, value]) => Number(value) > 0).map(([id, value]) => ({ orderId: id, amount: Number(value) }));
    const payload = { requestKey, amount: Number(amount), paymentDate: new Date(`${date}T00:00:00Z`).toISOString(), method, notes, isRefund: dialog === "refund", allocations: rows };
    return dialog === "allocate" ? api.allocate(storeId, customerId, payload) : api.payment(storeId, customerId, payload);
  }, onSuccess: async () => { if (dialog === "merge") navigate(`/owner/customers/${target}`); await refresh(); setDialog(""); } });
  const open = kind => { action.reset(); setClientError(""); setRequestKey(crypto.randomUUID()); setAmount(""); setNotes(""); setReason(""); setTarget(""); setAllocations({}); setDialog(kind); };
  const submit = e => {
    e.preventDefault();
    const validMoney = value => Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= Number.MAX_SAFE_INTEGER / 100 && Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) < 0.000001;
    if (["payment", "refund", "allocate"].includes(dialog) && (dialog !== "allocate" && !validMoney(amount) || Object.values(allocations).some(v => v !== "" && Number(v) !== 0 && !validMoney(v)))) { setClientError(t("أدخل مبالغ موجبة بمنزلتين عشريتين كحد أقصى")); return; }
    setClientError(""); action.mutate();
  };
  if (query.isLoading) return <Typography>{t("جارٍ تحميل حساب العميل...")}</Typography>;
  if (query.error) return <ErrorMessage error={query.error} />;
  const data = query.data; if (!data) return null;
  const orders = orderId ? data.orders.filter(o => o.id === orderId) : data.orders;
  const statement = orderId ? data.statement.filter(row => row.orderId === orderId || row.allocations?.some(a => a.orderId === orderId)) : data.statement;
  const reversed = new Set(data.statement.map(row => row.reversesEntryId));
  return <Stack spacing={3}>
    <Paper className="owner-panel" elevation={0}>
      <Typography variant="h5">{t("حساب العميل")}: {data.customer.firstName} {data.customer.lastName}</Typography>
      <Typography dir="ltr">{data.customer.phone || "—"}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, my: 3 }}>
        {[["إجمالي الطلبات", data.totalOrders], ["إجمالي المدفوعات", data.totalPayments], ["المبلغ المتبقي", data.outstandingBalance], ["رصيد دائن", data.credit]].map(([label, value]) => <Box key={label}><Typography color="text.secondary">{t(label)}</Typography><Typography variant="h6">{currency(value)}</Typography></Box>)}
      </Box>
      <Typography variant="body2" sx={{ mb: 2 }}>{t("رصيد غير موزع على الطلبات")}: {currency(data.unallocatedCredit)}</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button variant="contained" onClick={() => open("payment")}>{t("تسجيل دفعة")}</Button>
        <Button variant="outlined" onClick={() => open("refund")}>{t("تسجيل استرداد")}</Button>
        <Button onClick={() => open("allocate")}>{t("توزيع الرصيد")}</Button>
        {!orderId && <><Button onClick={() => open("edit")}>{t("تعديل العميل")}</Button><Button onClick={() => open("merge")}>{t("دمج ملف مكرر")}</Button></>}
        {orderId && <Button component={Link} to={`/owner/customers/${customerId}`}>{t("فتح حساب العميل")}</Button>}
      </Stack>
    </Paper>
    <Paper className="owner-panel" elevation={0}><Typography variant="h6" sx={{ mb: 2 }}>{t("الطلبات والمدفوعات")}</Typography>
      {orders.map(order => <Box key={order.id} className="owner-detail-list-item" sx={{ flexWrap: "wrap", gap: 2 }}>
        <Typography component={Link} to={`/owner/orders/${order.id}`}>{order.orderNumber}</Typography><Chip label={t(statusLabels[order.paymentStatus])} size="small" />
        <Typography>{t("إجمالي الطلبات")}: {currency(order.charge)} · {t("المدفوع")}: {currency(order.paidAmount)} · {t("المبلغ المتبقي")}: {currency(order.remainingAmount)}{order.credit > 0 ? ` · ${t("رصيد دائن")}: ${currency(order.credit)}` : ""}</Typography>
      </Box>)}
      {!orders.length && <Typography>{t("لا توجد طلبات لهذا العميل")}</Typography>}
    </Paper>
    <Paper className="owner-panel" elevation={0}><Typography variant="h6" sx={{ mb: 2 }}>{t("كشف الحساب")}</Typography>
      {statement.map(row => <Box key={row.id} sx={{ py: 2, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" justifyContent="space-between" useFlexGap flexWrap="wrap"><Typography fontWeight={700}>{t(kindLabels[row.kind] || row.kind)} · {currency(row.amount)}</Typography><Typography variant="body2">{dateTime(row.date)}</Typography></Stack>
        {row.orderId && <Button component={Link} to={`/owner/orders/${row.orderId}`} size="small">{row.orderNumber || t("الطلب")}</Button>}
        <Typography variant="body2">{row.method} {row.notes}</Typography>
        <Typography variant="body2">{t("الرصيد بعد الحركة")}: {currency(row.balance)}</Typography>
        {row.allocations?.map(a => <Typography key={a.orderId} variant="caption" display="block">{t("توزيع على الطلب")}: {a.orderNumber} — {currency(a.amount)}</Typography>)}
        {!["OrderCharge", "Reversal"].includes(row.kind) && !reversed.has(row.id) && <Button size="small" color="warning" onClick={() => { open("reverse"); setEntryId(row.id); }}>{t("تصحيح بعكس الحركة")}</Button>}
        {reversed.has(row.id) && <Chip size="small" label={t("تم عكس الحركة")} />}
      </Box>)}
      {!statement.length && <Typography>{t("لا توجد حركات مالية")}</Typography>}
    </Paper>
    <Dialog open={!!dialog} onClose={() => { if (!action.isPending) setDialog(""); }} fullWidth maxWidth="sm">
      <DialogTitle>{t(({ payment: "تسجيل دفعة", refund: "تسجيل استرداد", allocate: "توزيع الرصيد", edit: "تعديل العميل", merge: "دمج ملف مكرر", reverse: "عكس الحركة" })[dialog] || "")}</DialogTitle>
      <DialogContent>{dialog === "edit" ? <ProfileForm storeId={storeId} customer={data.customer} onClose={() => setDialog("")} /> : <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={submit}>
        {["merge", "reverse"].includes(dialog) ? <>
          {dialog === "merge" && <><Alert severity="info">{t("ستنقل الطلبات والحركات إلى الملف المختار مع حفظ سجل الدمج وبيانات الطلبات الأصلية.")}</Alert><CustomerPicker storeId={storeId} value={target} onChange={setTarget} exclude={customerId} /></>}
          <TextField label={t("سبب التصحيح")} required value={reason} onChange={e => setReason(e.target.value)} slotProps={{ htmlInput: { maxLength: 900 } }} />
        </> : <>
          {dialog !== "allocate" && <><TextField label={t("المبلغ")} type="number" required value={amount} onChange={e => {
            setAmount(e.target.value);
            if (orderId && orders[0]) setAllocations({ [orderId]: String(Math.min(Number(e.target.value), dialog === "refund" ? orders[0].paidAmount : orders[0].remainingAmount)) });
          }} slotProps={{ htmlInput: { min: 0.01, step: "0.01" } }} /><TextField label={t("تاريخ الدفع")} type="date" required value={date} onChange={e => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: new Date().toISOString().slice(0, 10) } }} /><TextField label={t("طريقة الدفع")} required value={method} onChange={e => setMethod(e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} /></>}
          <TextField label={t("ملاحظات")} value={notes} onChange={e => setNotes(e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
          <Typography variant="body2">{t("وزع المبلغ على طلب أو عدة طلبات. اترك الحقول فارغة لتسجيل دفعة عامة أو رصيد مقدم.")}</Typography>
          {(orderId ? orders : data.orders).filter(o => dialog === "refund" ? o.paidAmount > 0 : o.remainingAmount > 0).map(o => <TextField key={o.id} label={`${o.orderNumber} (${currency(dialog === "refund" ? o.paidAmount : o.remainingAmount)})`} type="number" value={allocations[o.id] || ""} onChange={e => setAllocations({ ...allocations, [o.id]: e.target.value })} slotProps={{ htmlInput: { min: 0, step: "0.01", max: dialog === "refund" ? o.paidAmount : o.remainingAmount } }} />)}
        </>}
        {clientError && <Alert severity="error">{clientError}</Alert>}<ErrorMessage error={action.error} /><Button type="submit" variant="contained" disabled={action.isPending}>{t("حفظ")}</Button>
      </Stack>}</DialogContent>
    </Dialog>
  </Stack>;
}

export function OrderCustomerAccount({ storeId, order }) {
  const { t } = useOwnerLanguage(); const refresh = useRefresh(storeId); const [edit, setEdit] = useState(false); const [target, setTarget] = useState(""); const [reason, setReason] = useState("");
  const reassign = useMutation({ mutationFn: () => api.reassign(storeId, order.id, target, reason), onSuccess: async () => { await refresh(); setEdit(false); } });
  return <Stack spacing={2} sx={{ my: 3 }}>
    {order.accountCustomerId ? <CustomerAccount key={order.accountCustomerId} storeId={storeId} customerId={order.accountCustomerId} orderId={order.id} /> : <Alert severity="info">{t("اربط الطلبات السابقة من صفحة العملاء لإظهار حساب هذا الطلب.")}</Alert>}
    <Button onClick={() => setEdit(!edit)}>{t("تصحيح العميل المرتبط بالطلب")}</Button>
    {edit && <Paper className="owner-panel" component="form" onSubmit={e => { e.preventDefault(); reassign.mutate(); }}><Stack spacing={2}>
      <CustomerPicker storeId={storeId} value={target} onChange={setTarget} /><TextField label={t("سبب التصحيح")} required value={reason} onChange={e => setReason(e.target.value)} slotProps={{ htmlInput: { maxLength: 900 } }} /><ErrorMessage error={reassign.error} /><Button type="submit" disabled={reassign.isPending}>{t("حفظ الربط")}</Button>
    </Stack></Paper>}
  </Stack>;
}
