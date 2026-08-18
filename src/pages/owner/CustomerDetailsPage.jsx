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
import useStoreCustomers from "../../hooks/customerStores/useStoreCustomers.js";
import useStoreOrders from "../../hooks/orders/useStoreOrders.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import { normalizeListResponse } from "../../utils/collections.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatUiDateTime } from "../../utils/numberFormat.js";
import { normalizeOrderDetails } from "../../utils/orders.js";
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

function formatDateTimeLabel(value) {
  return formatUiDateTime(value);
}

function DetailValue({ label, value }) {
  const [open, setOpen] = useState(false);
  const displayValue = value === null || value === undefined || value === "" ? "-" : String(value);
  const canExpand = displayValue !== "-" && displayValue.length > 12;

  return (
    <>
      <button
        type="button"
        className={`owner-detail-value${canExpand ? " owner-detail-value--expandable" : ""}`}
        onClick={canExpand ? () => setOpen(true) : undefined}
        aria-label={canExpand ? `${label}: ${displayValue}` : undefined}
        title={canExpand ? "اضغط لعرض النص كامل" : displayValue}
      >
        {displayValue}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ className: "owner-detail-value-dialog" }}
      >
        <DialogTitle>{label}</DialogTitle>
        <DialogContent>
          <Typography className="owner-detail-value-dialog__text">
            {displayValue}
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}

function normalizeStoreCustomer(item) {
  const firstName = String(item?.firstName || "").trim();
  const lastName = String(item?.lastName || "").trim();
  const fullName =
    String(item?.fullName || "").trim() ||
    `${firstName} ${lastName}`.trim() ||
    "عميل المتجر";

  return {
    id: String(item?.id || ""),
    storeId: String(item?.storeId || ""),
    firstName,
    lastName,
    fullName,
    email: String(item?.email || "").trim(),
    phone: String(item?.phone || "").trim(),
    discountPercentage: Number(item?.discountPercentage ?? 0),
    purchasePoints: Number(item?.purchasePoints ?? item?.points ?? 0),
    isActive: Boolean(item?.isActive ?? true),
    createdAt: item?.createdAt || "",
    updatedAt: item?.updatedAt || "",
  };
}

function DetailSidebar({ store }) {
  return (
    <Paper className="owner-sidebar" elevation={0}>
      <Box className="owner-sidebar__brand">
        <Typography variant="overline" className="owner-sidebar__eyebrow">
          ملف العميل
        </Typography>
        <Typography variant="h5">{store?.name || "متجرك"}</Typography>
        <Typography variant="body2" color="text.secondary">
          معلومات العميل والطلبات المرتبطة به داخل هذا المتجر فقط.
        </Typography>
      </Box>

      <Stack spacing={1.2}>
        <AppButton component={RouterLink} to="/owner/customers" variant="contained">
          العودة إلى العملاء
        </AppButton>
        <AppButton component={RouterLink} to="/owner/orders" variant="outlined">
          الطلبات
        </AppButton>
      </Stack>
    </Paper>
  );
}

export default function CustomerDetailsPage() {
  const { customerId = "" } = useParams();
  const { isAuthenticated, role } = useAuth();
  const isOwner = isOwnerRole(role);
  const ownerStoreQuery = useOwnerStore({
    refetchOnWindowFocus: false,
    enabled: isAuthenticated && isOwner,
  });
  const store = ownerStoreQuery.ownerStore;
  const storeId = store?.id;
  const customersQuery = useStoreCustomers(storeId, {
    enabled: isAuthenticated && isOwner && Boolean(storeId),
    staleTime: 30000,
  });
  const ordersQuery = useStoreOrders(storeId, {
    enabled: isAuthenticated && isOwner && Boolean(storeId),
    staleTime: 30000,
  });

  const customers = useMemo(
    () =>
      normalizeListResponse(customersQuery.data)
        .map((item) => normalizeStoreCustomer(item))
        .filter((item) => item.id),
    [customersQuery.data],
  );
  const customer = useMemo(
    () => customers.find((item) => String(item.id) === String(customerId)) || null,
    [customerId, customers],
  );
  const customerOrders = useMemo(
    () =>
      normalizeListResponse(ordersQuery.data)
        .map((item) => normalizeOrderDetails(item))
        .filter(
          (item) => String(item.storeCustomerId || "") === String(customerId),
        ),
    [customerId, ordersQuery.data],
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

  return (
    <DashboardLayout sidebar={<DetailSidebar store={store} />}>
      <Box className="owner-dashboard owner-detail-shell">
        {customersQuery.isLoading ? (
          <LoadingState label="جارٍ تحميل بيانات العميل..." />
        ) : customersQuery.error ? (
          <Alert severity="error">
            تعذر تحميل بيانات عملاء المتجر حالياً.
          </Alert>
        ) : !customer ? (
          <EmptyState
            title="العميل غير موجود"
            description="قد يكون العميل غير مضاف لهذا المتجر أو تم إزالته."
          />
        ) : (
          <>
            <Paper className="owner-panel owner-detail-hero" elevation={0}>
              <Box>
                <Typography variant="overline" className="owner-hero__eyebrow">
                  عميل المتجر
                </Typography>
                <Typography variant="h4" className="owner-panel__title">
                  {customer.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  أضيف بتاريخ {formatDateTimeLabel(customer.createdAt)}
                </Typography>
                <Typography variant="subtitle1" className="owner-detail-points-line">
                  {customer.purchasePoints.toLocaleString("ar-u-nu-latn")} نقطة شراء
                </Typography>
              </Box>

              <Chip
                size="small"
                label={customer.isActive ? "نشط" : "متوقف"}
                color={customer.isActive ? "primary" : "default"}
                variant={customer.isActive ? "filled" : "outlined"}
              />
            </Paper>

            <Box className="owner-detail-grid">
              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">معلومات التواصل</Typography>
                <Box className="owner-detail-card__row">
                  <span>الاسم</span>
                  <strong>
                    <DetailValue label="الاسم" value={customer.fullName} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>البريد</span>
                  <strong>
                    <DetailValue label="البريد" value={customer.email || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>الهاتف</span>
                  <strong>
                    <DetailValue label="الهاتف" value={customer.phone || "-"} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>المعرف</span>
                  <strong>
                    <DetailValue label="المعرف" value={customer.id} />
                  </strong>
                </Box>
              </Paper>

              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">إعدادات الحساب</Typography>
                <Box className="owner-detail-card__row">
                  <span>خصم الجملة</span>
                  <strong>
                    <DetailValue label="خصم الجملة" value={`${customer.discountPercentage}%`} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>نقاط الشراء</span>
                  <strong>
                    <DetailValue
                      label="نقاط الشراء"
                      value={`${customer.purchasePoints.toLocaleString("ar-u-nu-latn")} نقطة`}
                    />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>الحالة</span>
                  <strong>{customer.isActive ? "نشط" : "متوقف"}</strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>آخر تحديث</span>
                  <strong>
                    <DetailValue label="آخر تحديث" value={formatDateTimeLabel(customer.updatedAt)} />
                  </strong>
                </Box>
              </Paper>

              <Paper className="owner-panel owner-detail-card" elevation={0}>
                <Typography variant="h6">ملخص الطلبات</Typography>
                <Box className="owner-detail-card__row">
                  <span>عدد الطلبات</span>
                  <strong>
                    <DetailValue label="عدد الطلبات" value={customerOrders.length} />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>إجمالي المشتريات</span>
                  <strong>
                    <DetailValue
                      label="إجمالي المشتريات"
                      value={formatCurrency(
                        customerOrders.reduce(
                          (sum, order) => sum + Number(order.totalAmount || 0),
                          0,
                        ),
                      )}
                    />
                  </strong>
                </Box>
                <Box className="owner-detail-card__row">
                  <span>آخر طلب</span>
                  <strong>
                    <DetailValue
                      label="آخر طلب"
                      value={
                        customerOrders[0]
                          ? formatDateTimeLabel(customerOrders[0].createdAt)
                          : "-"
                      }
                    />
                  </strong>
                </Box>
              </Paper>
            </Box>

            <Paper className="owner-panel owner-detail-card" elevation={0}>
              <Box className="owner-order-dialog__items-head">
                <Typography variant="h6">طلبات العميل</Typography>
                <Typography variant="body2" color="text.secondary">
                  {customerOrders.length} طلب
                </Typography>
              </Box>

              {ordersQuery.isLoading ? (
                <LoadingState />
              ) : ordersQuery.error ? (
                <Alert severity="warning">
                  تعذر تحميل طلبات هذا العميل حالياً.
                </Alert>
              ) : customerOrders.length ? (
                <Stack spacing={1.2}>
                  {customerOrders.map((order) => (
                    <Box key={order.id} className="owner-detail-list-item">
                      <Box>
                        <Typography
                          component={RouterLink}
                          to={`/owner/orders/${order.id}`}
                          variant="subtitle2"
                          className="owner-order-card__link"
                        >
                          {order.orderNumber || order.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
                          <DetailValue label="تاريخ الطلب" value={formatDateTimeLabel(order.createdAt)} />
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={order.statusText || getOrderStatusLabel(order.status)}
                          variant="outlined"
                        />
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  title="لا توجد طلبات لهذا العميل"
                  description="عند إنشاء طلب جديد سيظهر هنا مباشرة."
                />
              )}
            </Paper>
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
