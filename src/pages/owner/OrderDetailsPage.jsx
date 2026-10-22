import BundleOrderSummary from "../../components/offers/BundleOrderSummary.jsx";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { useMemo, useState } from "react";
import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
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


import { isOwnerRole, isSuperAdminRole } from "../../utils/roles.js";
import "./OwnerDashboard.css";
import OrderProductImage from "../../components/order/OrderProductImage.jsx";

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



function DetailValue({ label, value }) {
  const { t } = useOwnerLanguage();
  const [open, setOpen] = useState(false);
  const displayValue = value === null || value === undefined || value === "" ? "-" : String(value);
  const canExpand = displayValue !== "-" && displayValue.length > 12;

  return (
    <>
      <button
        type="button"
        className={`owner-detail-value${canExpand ? " owner-detail-value--expandable" : ""}`}
        onClick={canExpand ? () => setOpen(true) : undefined}
        aria-label={t(canExpand ? `${label}: ${displayValue}` : undefined)}
        title={t(canExpand ? "اضغط لعرض النص كامل" : displayValue)}
      >
        {t(displayValue)}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "owner-detail-value-dialog" }}
      >
        <DialogTitle>{t(label)}</DialogTitle>
        <DialogContent>
          <Typography className="owner-detail-value-dialog__text">
            {t(displayValue)}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailSidebar({ store }) {
  const { t } = useOwnerLanguage();
  return (
    <Paper className="owner-sidebar" elevation={0}>
      <Box className="owner-sidebar__brand">
        <Typography variant="overline" className="owner-sidebar__eyebrow">{t("تفاصيل الطلب")}</Typography>
        <Typography variant="h5">{t(store?.name || "متجرك")}</Typography>
        <Typography variant="body2" color="text.secondary">{t("راجع بيانات الطلب، العميل، وعناصر الشراء من صفحة واحدة.")}</Typography>
      </Box>

      <Stack spacing={1.2}>
        <AppButton component={RouterLink} to="/owner/orders" variant="contained">{t("العودة إلى الطلبات")}</AppButton>
        <AppButton component={RouterLink} to="/owner" variant="outlined">{t("لوحة المتجر")}</AppButton>
      </Stack>
    </Paper>
  );
}

export default function OrderDetailsPage() {
  const { t , dateTime, currency} = useOwnerLanguage();
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
    enabled: isAuthenticated && isOwner && !store?.isCatalog && Boolean(storeId) && Boolean(orderId),
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
    return <LoadingState label={t("جارٍ تحميل بيانات المتجر...")} />;
  }

  if (store?.isCatalog) return <Navigate to="/owner" replace />;

  if (!store) {
    return (
      <EmptyState
        title={t("لا يوجد متجر مرتبط بهذا الحساب")}
        description={t("تعذر تحديد متجر المالك الحالي.")}
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
          <LoadingState label={t("جارٍ تحميل تفاصيل الطلب...")} />
        ) : orderQuery.error ? (
          <Alert severity="error">{t("تعذر تحميل هذا الطلب. تأكد من أن الطلب يتبع لمتجرك الحالي.")}</Alert>
        ) : !order ? (
          <EmptyState
            title={t("الطلب غير موجود")}
            description={t("قد يكون الطلب محذوفاً أو لا يتبع لهذا المتجر.")}
          />
        ) : (
          <>
            <Paper className="owner-panel owner-detail-hero" elevation={0}>
              <Box>
                <Typography variant="overline" className="owner-hero__eyebrow">{t("طلب #")}{t(order.orderNumber || order.id)}
                </Typography>
                <Typography variant="h4" className="owner-panel__title">
                  {t(order.title || "تفاصيل الطلب")}
                </Typography>
                <Typography variant="body2" color="text.secondary">{t("أُنشئ في")}{t(dateTime(order.createdAt))}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={t(statusLabel)}
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
                  >{t("ملف العميل")}</AppButton>
                ) : null}
              </Stack>
            </Paper>

            <Box className="owner-detail-grid">
              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">{t("ملخص الطلب")}</Typography>
                <Box className="owner-detail-card__row">
                  <span>{t("رقم الطلب")}</span>
                  <strong>
                    <DetailValue label={t("رقم الطلب")} value={order.orderNumber || order.id || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("عدد القطع")}</span>
                  <strong>
                    <DetailValue label={t("عدد القطع")} value={order.itemsCount ?? 0} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("الإجمالي قبل الخصم")}</span>
                  <strong>
                    <DetailValue label={t("الإجمالي قبل الخصم")} value={currency(order.subtotal)} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("الخصم")}</span>
                  <strong>
                    <DetailValue label={t("الخصم")} value={currency(order.discount)} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row owner-detail-card__row--total">
                  <span>{t("الإجمالي النهائي")}</span>
                  <strong>
                    <DetailValue label={t("الإجمالي النهائي")} value={currency(order.totalAmount)} />
                  </strong>
                </Box>
              </Paper>

              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">{t("بيانات العميل")}</Typography>
                <Box className="owner-detail-card__row">
                  <span>{t("الاسم")}</span>
                  <strong>
                    <DetailValue label={t("الاسم")} value={customerName} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("البريد")}</span>
                  <strong>
                    <DetailValue label={t("البريد")} value={order.customerEmail || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("الهاتف")}</span>
                  <strong>
                    <DetailValue label={t("الهاتف")} value={order.customerPhone || order.deliveryPhone || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("معرف العميل")}</span>
                  <strong>
                    <DetailValue label={t("معرف العميل")} value={order.storeCustomerId || "-"} />
                  </strong>
                </Box>
              </Paper>

              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">{t("التوصيل والملاحظات")}</Typography>
                <Box className="owner-detail-card__row">
                  <span>{t("العنوان")}</span>
                  <strong>
                    <DetailValue label={t("العنوان")} value={order.deliveryAddress || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("المدينة")}</span>
                  <strong>
                    <DetailValue label={t("مكان التوصيل")} value={order.deliveryLocationName || "افتراضي"} />
                    <DetailValue label={t("كلفة التوصيل")} value={currency(order.deliveryCost || 0)} />
                    <DetailValue label={t("المدينة")} value={order.deliveryCity || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>{t("الكوبون")}</span>
                  <strong>
                    <DetailValue label={t("الكوبون")} value={order.couponCode || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-note">
                  <Typography variant="subtitle2">{t("ملاحظات العميل")}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(order.customerNotes || "لا توجد ملاحظات مضافة على هذا الطلب.")}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            <Paper className="owner-panel owner-detail-card" elevation={0}>
              <Box className="owner-order-dialog__items-head">
                <Typography variant="h6">{t("عناصر الطلب")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(order.items.length)}{t("عنصر")}</Typography>
              </Box>

              <BundleOrderSummary items={order.items} t={t} />
              {order.items.length ? (
                <Stack spacing={1.2}>
                  {order.items.map((item, index) => (
                    <Box
                      key={item.id || item.productId || `order-item-${index}`}
                      className="owner-order-item"
                    >
                      <Box className="owner-order-item__head">
                        <OrderProductImage item={item} />
                        <Box>
                          <Typography variant="subtitle2">
                            {t(item.productName || `منتج ${index + 1}`)}
                            {item.bundleName && <Typography component="span" display="block" variant="caption" color="warning.main">{t("باكيج")}: {item.bundleName}</Typography>}
                          </Typography>
                          {item.variantName ? (
                            <Typography variant="caption" color="text.secondary">
                              {t(item.variantName)}
                            </Typography>
                          ) : null}
                        </Box>

                        <Typography variant="subtitle2">
                          {t(currency(item.totalPrice))}
                        </Typography>
                      </Box>

                      <Box className="owner-order-item__meta">
                        <span>{t("الكمية:")}{t(item.quantity)}</span>
                        <span>{t("سعر الوحدة:")}{t(currency(item.unitPrice))}</span>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  title={t("لا توجد عناصر لهذا الطلب")}
                  description={t("إذا استمرت المشكلة، راجع البيانات القادمة من الـ API لهذا الطلب.")}
                />
              )}
            </Paper>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
