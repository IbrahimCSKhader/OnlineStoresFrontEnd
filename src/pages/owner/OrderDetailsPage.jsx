import { useMemo } from "react";
import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useStoreOrderDetails from "../../hooks/orders/useStoreOrderDetails.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import { normalizeOrderDetails } from "../../utils/orders.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { isOwnerRole, isSuperAdminRole } from "../../utils/roles.js";
import "./OwnerDashboard.css";

const ORDER_STATUS_LABELS = {
  0: "قيد الانتظار",
  1: "تم التأكيد",
  2: "قيد التجهيز",
  3: "تم الشحن",
  4: "تم التسليم",
  5: "ملغي",
  6: "مسترجع",
};

function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[Number(status)] || "غير محدد";
}

function getStatusTone(status) {
  const normalizedStatus = Number(status);

  if (normalizedStatus === 4) return "success";
  if (normalizedStatus === 5 || normalizedStatus === 6) return "error";
  if (normalizedStatus >= 1) return "primary";
  return "default";
}

function formatDateTimeLabel(value) {
  if (!value) return "-";

  const parsedValue = new Date(value);
  if (Number.isNaN(parsedValue.getTime())) {
    return "-";
  }

  return parsedValue.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailSidebar({ store }) {
  return (
    <Paper className="owner-sidebar" elevation={0}>
      <Box className="owner-sidebar__brand">
        <Typography variant="overline" className="owner-sidebar__eyebrow">
          تفاصيل الطلب
        </Typography>
        <Typography variant="h5">{store?.name || "متجرك"}</Typography>
        <Typography variant="body2" color="text.secondary">
          راجع بيانات الطلب، العميل، وعناصر الشراء من صفحة واحدة.
        </Typography>
      </Box>

      <Stack spacing={1.2}>
        <AppButton component={RouterLink} to="/owner/orders" variant="contained">
          العودة إلى الطلبات
        </AppButton>
        <AppButton component={RouterLink} to="/owner" variant="outlined">
          لوحة المتجر
        </AppButton>
      </Stack>
    </Paper>
  );
}

export default function OrderDetailsPage() {
  const { orderId = "" } = useParams();
  const { isAuthenticated, role } = useAuth();
  const isOwner = isOwnerRole(role);
  const ownerStoreQuery = useOwnerStore({
    refetchOnWindowFocus: false,
    enabled: isAuthenticated && isOwner,
  });
  const store = ownerStoreQuery.ownerStore;
  const storeId = store?.id;
  const orderQuery = useStoreOrderDetails(storeId, orderId, {
    enabled: isAuthenticated && isOwner && Boolean(storeId) && Boolean(orderId),
    staleTime: 30000,
  });
  const order = useMemo(
    () => (orderQuery.data ? normalizeOrderDetails(orderQuery.data) : null),
    [orderQuery.data],
  );

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isOwner) {
    return <Navigate to={isSuperAdminRole(role) ? "/dashboard" : "/"} replace />;
  }

  if (ownerStoreQuery.isLoading) {
    return <LoadingState label="جارٍ تحميل بيانات المتجر..." />;
  }

  if (!store) {
    return (
      <EmptyState
        title="لا يوجد متجر مرتبط بهذا الحساب"
        description="تعذر تحديد متجر المالك الحالي."
      />
    );
  }

  const statusLabel =
    order?.statusText || order?.statusLabel || getOrderStatusLabel(order?.status);
  const customerName =
    order?.customerName || order?.customerEmail || "عميل المتجر";

  return (
    <DashboardLayout sidebar={<DetailSidebar store={store} />}>
      <Box className="owner-dashboard owner-detail-shell">
        {orderQuery.isLoading ? (
          <LoadingState label="جارٍ تحميل تفاصيل الطلب..." />
        ) : orderQuery.error ? (
          <Alert severity="error">
            تعذر تحميل هذا الطلب. تأكد من أن الطلب يتبع لمتجرك الحالي.
          </Alert>
        ) : !order ? (
          <EmptyState
            title="الطلب غير موجود"
            description="قد يكون الطلب محذوفاً أو لا يتبع لهذا المتجر."
          />
        ) : (
          <>
            <Paper className="owner-panel owner-detail-hero" elevation={0}>
              <Box>
                <Typography variant="overline" className="owner-hero__eyebrow">
                  طلب #{order.orderNumber || order.id}
                </Typography>
                <Typography variant="h4" className="owner-panel__title">
                  {order.title || "تفاصيل الطلب"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  أُنشئ في {formatDateTimeLabel(order.createdAt)}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={statusLabel}
                  color={getStatusTone(order.status)}
                  variant={
                    getStatusTone(order.status) === "default"
                      ? "outlined"
                      : "filled"
                  }
                />
                {order.storeCustomerId ? (
                  <AppButton
                    component={RouterLink}
                    to={`/owner/customers/${order.storeCustomerId}`}
                    variant="outlined"
                    size="small"
                  >
                    ملف العميل
                  </AppButton>
                ) : null}
              </Stack>
            </Paper>

            <Box className="owner-detail-grid">
              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">ملخص الطلب</Typography>
                <Box className="owner-detail-card__row">
                  <span>رقم الطلب</span>
                  <strong>{order.orderNumber || order.id || "-"}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>عدد القطع</span>
                  <strong>{order.itemsCount ?? 0}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>الإجمالي قبل الخصم</span>
                  <strong>{formatCurrency(order.subtotal)}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>الخصم</span>
                  <strong>{formatCurrency(order.discount)}</strong>
                </Box>
                <Box className="owner-detail-card__row owner-detail-card__row--total">
                  <span>الإجمالي النهائي</span>
                  <strong>{formatCurrency(order.totalAmount)}</strong>
                </Box>
              </Paper>

              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">بيانات العميل</Typography>
                <Box className="owner-detail-card__row">
                  <span>الاسم</span>
                  <strong>{customerName}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>البريد</span>
                  <strong>{order.customerEmail || "-"}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>الهاتف</span>
                  <strong>{order.customerPhone || order.deliveryPhone || "-"}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>معرف العميل</span>
                  <strong>{order.storeCustomerId || "-"}</strong>
                </Box>
              </Paper>

              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">التوصيل والملاحظات</Typography>
                <Box className="owner-detail-card__row">
                  <span>العنوان</span>
                  <strong>{order.deliveryAddress || "-"}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>المدينة</span>
                  <strong>{order.deliveryCity || "-"}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>الكوبون</span>
                  <strong>{order.couponCode || "-"}</strong>
                </Box>
                <Box className="owner-detail-note">
                  <Typography variant="subtitle2">ملاحظات العميل</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customerNotes || "لا توجد ملاحظات مضافة على هذا الطلب."}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            <Paper className="owner-panel owner-detail-card" elevation={0}>
              <Box className="owner-order-dialog__items-head">
                <Typography variant="h6">عناصر الطلب</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.items.length} عنصر
                </Typography>
              </Box>

              {order.items.length ? (
                <Stack spacing={1.2}>
                  {order.items.map((item, index) => (
                    <Box
                      key={item.id || item.productId || `order-item-${index}`}
                      className="owner-order-item"
                    >
                      <Box className="owner-order-item__head">
                        <Box>
                          <Typography variant="subtitle2">
                            {item.productName || `منتج ${index + 1}`}
                          </Typography>
                          {item.variantName ? (
                            <Typography variant="caption" color="text.secondary">
                              {item.variantName}
                            </Typography>
                          ) : null}
                        </Box>

                        <Typography variant="subtitle2">
                          {formatCurrency(item.totalPrice)}
                        </Typography>
                      </Box>

                      <Box className="owner-order-item__meta">
                        <span>الكمية: {item.quantity}</span>
                        <span>سعر الوحدة: {formatCurrency(item.unitPrice)}</span>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  title="لا توجد عناصر لهذا الطلب"
                  description="إذا استمرت المشكلة، راجع البيانات القادمة من الـ API لهذا الطلب."
                />
              )}
            </Paper>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
