import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { customerAccountApi } from "../../API/customerAccount.api.js";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import useStoreOrders from "../../hooks/orders/useStoreOrders.js";
import useSuperAdminStoreWorkspace from "../../hooks/superAdmin/useSuperAdminStoreWorkspace.js";
import { buildDisplayName, formatAdminDateTime, formatAdminNumber } from "../../utils/adminDashboard.js";
import { normalizeEntityResponse, normalizeListResponse } from "../../utils/collections.js";
import formatCurrency from "../../utils/formatCurrency.js";
import { normalizeOrderDetails } from "../../utils/orders.js";
import { getOrderStatusLabel, getOrderStatusTone, ORDER_STATUS } from "../../utils/orderStatus.js";
import { canUseStoreCoupons } from "../../utils/storeCoupons.js";

const pendingStatuses = new Set([ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING, ORDER_STATUS.SHIPPED]);
const paymentLabels = { paid: "مدفوع", partial: "دفعة جزئية", unpaid: "غير مدفوع", credit: "رصيد دائن" };

function hasRecordedBalance(order) {
  return order.receivedAmount != null && Number(order.remainingAmount) > 0;
}

function ActivityList({ query, items, empty, children }) {
  if (query.isPending) return <LoadingState />;
  if (query.isError) return (
    <Alert severity="error" action={<Button onClick={() => query.refetch()}>إعادة المحاولة</Button>}>
      تعذّر تحميل البيانات.
    </Alert>
  );
  if (items.length === 0) return <Typography color="text.secondary">{empty}</Typography>;
  return <ul className="super-admin-activity-list">{items.map(children)}</ul>;
}

export default function StoreActivity({ store }) {
  const workspace = useSuperAdminStoreWorkspace(store.id);
  const storefront = normalizeEntityResponse(workspace.data);
  const supportsCheckout = Boolean(storefront && !storefront.isCatalog);
  const orders = useStoreOrders(store.id, { enabled: supportsCheckout, staleTime: 30000 });
  const customers = useQuery({
    queryKey: ["customerAccounts", store.id, "list", "", 1],
    queryFn: () => customerAccountApi.list(store.id),
    staleTime: 30000,
  });
  const [orderFilter, setOrderFilter] = useState("recent");
  const basePath = `/dashboard/stores/${store.id}/manage`;
  const orderRows = normalizeListResponse(orders.data).map(normalizeOrderDetails);
  const openOrders = orderRows.filter((order) => pendingStatuses.has(order.status));
  const recentOrders = (orderFilter === "open" ? openOrders : orderFilter === "balance" ? orderRows.filter(hasRecordedBalance) : orderRows).slice(0, 6);
  const recentCustomers = normalizeListResponse(customers.data).slice(0, 6);
  const shortcuts = [
    ["products", "المنتجات"], ["categories", "التصنيفات"], ["sections", "الأقسام"], ["offers", "العروض"],
    ...(supportsCheckout ? [["orders", "الطلبات"], ["customers", "حسابات الزباين"]] : []),
    ...(storefront && canUseStoreCoupons(storefront) ? [["coupons", "الكوبونات"]] : []),
    ["reviews", "التقييمات"], ["subscriptions", "الاشتراكات"],
  ];
  const metrics = [
    ...(supportsCheckout ? [
      ["كل الطلبات", orders.isSuccess ? orderRows.length : null, "orders"],
      ["طلبات قيد المتابعة", orders.isSuccess ? openOrders.length : null, null],
    ] : []),
    ["ملفات الزباين", customers.isSuccess ? customers.data?.total : null, supportsCheckout ? "customers" : null],
    ["زيارات المتجر", store.visitCount, null],
  ];

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1}>
        <Typography component="h3" variant="h6">أرقام المتجر</Typography>
        <Box className="super-admin-kpi-grid">
          {metrics.map(([label, value, path]) => (
            <Paper className="super-admin-kpi-card super-admin-kpi-card--cool" elevation={0} key={label}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="h5" className="super-admin-kpi-card__value">
                {value == null ? "—" : formatAdminNumber(value)}
              </Typography>
              {path && <Button component={Link} to={`${basePath}/${path}`} size="small" sx={{ justifySelf: "start" }}>عرض {label}</Button>}
            </Paper>
          ))}
        </Box>
      </Stack>

      <Stack spacing={1}>
        <Typography component="h3" variant="h6">وصول سريع</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {shortcuts.map(([path, label]) => (
            <Button key={path} component={Link} to={`${basePath}/${path}`} variant="outlined" size="small">{label}</Button>
          ))}
        </Stack>
      </Stack>

      {workspace.isError && (
        <Alert severity="error" action={<Button onClick={() => workspace.refetch()}>إعادة المحاولة</Button>}>
          تعذّر تحديد وضع المتجر. بيانات الطلبات غير متاحة حاليًا.
        </Alert>
      )}
      {storefront?.isCatalog && <Alert severity="info">هذا المتجر يعمل ككتالوج للعرض، والشراء من الواجهة غير متاح.</Alert>}
      <Box className="super-admin-quick-grid">
        {supportsCheckout && (
          <Paper className="super-admin-detail-card super-admin-activity-card" elevation={0}>
            <Stack direction="row" alignItems="center" flexWrap="wrap" justifyContent="space-between" gap={1}>
              <Typography component="h3" variant="h6">الطلبات</Typography>
              <TextField select size="small" label="عرض الطلبات" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} sx={{ minWidth: 160 }}>
                <MenuItem value="recent">الأحدث</MenuItem>
                <MenuItem value="open">قيد المتابعة</MenuItem>
                <MenuItem value="balance">باقي مبلغ مسجّل</MenuItem>
              </TextField>
            </Stack>
            <ActivityList query={orders} items={recentOrders} empty="ما في طلبات ضمن العرض المحدد.">
              {(order) => (
                <li key={order.id}>
                  <Stack minWidth={0} spacing={0.25}>
                    <Typography component={Link} to={`${basePath}/orders/${order.id}`} fontWeight={700}>{order.orderNumber}</Typography>
                    <Typography variant="body2">{order.customerName || "زبون المتجر"}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatAdminDateTime(order.createdAt)}</Typography>
                  </Stack>
                  <Stack spacing={0.5} alignItems="end">
                    <Typography fontWeight={700}>{formatCurrency(order.totalAmount)}</Typography>
                    <Chip size="small" label={getOrderStatusLabel(order.status)} color={getOrderStatusTone(order.status)} />
                    <Typography variant="caption" color="text.secondary">
                      {order.receivedAmount == null ? "الاستلام غير مسجّل" : paymentLabels[order.paymentStatus] ?? "حالة الدفع غير متاحة"}
                    </Typography>
                  </Stack>
                </li>
              )}
            </ActivityList>
            <Button component={Link} to={`${basePath}/orders`} sx={{ justifySelf: "start" }}>عرض كل الطلبات</Button>
          </Paper>
        )}

        <Paper className="super-admin-detail-card super-admin-activity-card" elevation={0}>
          <Typography component="h3" variant="h6">أحدث ملفات الزباين</Typography>
          <ActivityList query={customers} items={recentCustomers} empty="ما في ملفات زباين لهذا المتجر.">
            {(customer) => (
              <li key={customer.id}>
                <Stack minWidth={0} spacing={0.25}>
                  {supportsCheckout ? (
                    <Typography component={Link} to={`${basePath}/customers/${customer.id}`} fontWeight={700}>{buildDisplayName(customer, "زبون المتجر")}</Typography>
                  ) : <Typography fontWeight={700}>{buildDisplayName(customer, "زبون المتجر")}</Typography>}
                  {customer.phone && <Typography variant="caption" dir="ltr" sx={{ textAlign: "right" }}>{customer.phone}</Typography>}
                </Stack>
                <Chip size="small" variant="outlined" label={customer.isGuestProfile ? "بدون تسجيل" : "حساب مسجّل"} />
              </li>
            )}
          </ActivityList>
          {supportsCheckout && <Button component={Link} to={`${basePath}/customers`} sx={{ justifySelf: "start" }}>عرض الزباين وحساباتهم</Button>}
        </Paper>
      </Box>
    </Stack>
  );
}
