import { useMemo } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useMyOrders from "../../hooks/orders/useMyOrders.js";
import useMyPurchasePoints from "../../hooks/orders/useMyPurchasePoints.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse, normalizeListResponse } from "../../utils/collections.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import extractApiError from "../../utils/extractApiError.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatUiDateTime, formatUiNumber } from "../../utils/numberFormat.js";
import { normalizeOrderDetails } from "../../utils/orders.js";
import "./MyOrders.css";

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

function getStatusClassName(status) {
  const normalizedStatus = Number(status);

  if (normalizedStatus === 4) return "customer-orders-status--success";
  if (normalizedStatus === 5 || normalizedStatus === 6) return "customer-orders-status--danger";
  if (normalizedStatus >= 1) return "customer-orders-status--active";
  return "customer-orders-status--pending";
}

function toNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

function formatPoints(value) {
  return `${formatUiNumber(toNumber(value, 0))} نقطة`;
}

function StatTile({ icon, label, value }) {
  return (
    <Box className="customer-points-stat">
      <Box className="customer-points-stat__icon" aria-hidden>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Box>
  );
}

export default function MyOrders() {
  const { slug = "" } = useParams();
  const auth = useAuth();
  const storeQuery = useStoreBySlug(slug, { staleTime: 60000 });
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );
  const resolvedStoreSlug = store?.slug || slug || "";
  const storefrontSession = useStorefrontSession(store?.id, resolvedStoreSlug);
  const isStoreCustomerSignedIn =
    auth.isAuthenticated &&
    auth.isStoreCustomer &&
    storefrontSession.hasScopedStorefrontSession;

  const pointsQuery = useMyPurchasePoints({
    enabled: isStoreCustomerSignedIn,
    staleTime: 30000,
  });
  const ordersQuery = useMyOrders({
    enabled: isStoreCustomerSignedIn,
    staleTime: 30000,
  });

  const points = useMemo(
    () => normalizeEntityResponse(pointsQuery.data) || {},
    [pointsQuery.data],
  );
  const orders = useMemo(
    () =>
      normalizeListResponse(ordersQuery.data)
        .map((item) => normalizeOrderDetails(item))
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)),
    [ordersQuery.data],
  );

  const loginPath = buildStorefrontPath(resolvedStoreSlug, "/login");
  const productsPath = buildStorefrontPath(resolvedStoreSlug, "/products");
  const cartPath = buildStorefrontPath(resolvedStoreSlug, "/cart");
  const totalPoints = toNumber(points.purchasePoints, orders[0]?.customerPurchasePoints || 0);
  const pointsPerProduct = toNumber(points.pointsPerProduct, 5);
  const totalOrders = toNumber(points.totalOrders, orders.length);
  const totalPurchasedItems = toNumber(
    points.totalPurchasedItems,
    orders.reduce((sum, order) => sum + toNumber(order.itemsCount, 0), 0),
  );
  const recentPointsEarned = toNumber(points.recentPointsEarned, orders[0]?.pointsEarned || 0);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page customer-orders-page">
        <LoadingState label="جارٍ تحميل بيانات المتجر..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page customer-orders-page">
        <EmptyState
          title="تعذر فتح صفحة النقاط"
          description="لم نتمكن من تحديد المتجر المرتبط بهذه الصفحة."
        />
      </Box>
    );
  }

  if (!isStoreCustomerSignedIn) {
    return (
      <Box className="storefront-page customer-orders-page">
        <EmptyState
          title="سجّل الدخول لرؤية نقاطك"
          description="نقاط الشراء مرتبطة بحسابك داخل هذا المتجر."
          action={
            <AppButton component={RouterLink} to={loginPath} variant="contained">
              تسجيل الدخول
            </AppButton>
          }
        />
      </Box>
    );
  }

  return (
    <Box className="storefront-page customer-orders-page">
      {pointsQuery.error ? (
        <Alert severity="error">
          {extractApiError(pointsQuery.error, "تعذر تحميل نقاط الشراء حالياً.")}
        </Alert>
      ) : null}

      <Box className="customer-points-hero">
        <Box className="customer-points-hero__copy">
          <Typography variant="overline" className="customer-points-eyebrow">
            نقاط الشراء
          </Typography>
          <Typography variant="h3" className="customer-points-hero__title">
            {formatPoints(totalPoints)}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            تحصل على {formatPoints(pointsPerProduct)} لكل منتج يتم شراؤه من هذا المتجر.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <AppButton component={RouterLink} to={productsPath} variant="contained">
            متابعة التسوق
          </AppButton>
          <AppButton component={RouterLink} to={cartPath} variant="outlined">
            السلة
          </AppButton>
        </Stack>
      </Box>

      <Box className="customer-points-stats">
        <StatTile
          icon={<LocalMallRoundedIcon fontSize="small" />}
          label="عدد الطلبات"
          value={formatUiNumber(totalOrders)}
        />
        <StatTile
          icon={<Inventory2RoundedIcon fontSize="small" />}
          label="القطع المشتراة"
          value={formatUiNumber(totalPurchasedItems)}
        />
        <StatTile
          icon={<EmojiEventsRoundedIcon fontSize="small" />}
          label="آخر نقاط مكتسبة"
          value={formatPoints(recentPointsEarned)}
        />
        <StatTile
          icon={<HistoryRoundedIcon fontSize="small" />}
          label="آخر طلب"
          value={formatUiDateTime(points.lastOrderAt || orders[0]?.createdAt)}
        />
      </Box>

      <Box className="customer-orders-section">
        <Box className="customer-orders-section__head">
          <Box>
            <Typography variant="overline" className="customer-points-eyebrow">
              السجل
            </Typography>
            <Typography variant="h5">طلباتي ونقاطها</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {formatUiNumber(orders.length)} طلب
          </Typography>
        </Box>

        {ordersQuery.isLoading ? (
          <LoadingState label="جارٍ تحميل الطلبات..." />
        ) : ordersQuery.error ? (
          <Alert severity="error">
            {extractApiError(ordersQuery.error, "تعذر تحميل الطلبات حالياً.")}
          </Alert>
        ) : orders.length ? (
          <Box className="customer-orders-grid">
            {orders.map((order) => {
              const statusLabel =
                order.statusText || order.statusLabel || getOrderStatusLabel(order.status);

              return (
                <Box key={order.id} className="customer-order-card">
                  <Box className="customer-order-card__head">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        رقم الطلب
                      </Typography>
                      <Typography variant="h6">
                        {order.orderNumber || order.id}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={statusLabel}
                      className={getStatusClassName(order.status)}
                    />
                  </Box>

                  <Box className="customer-order-card__summary">
                    <Box>
                      <span>النقاط</span>
                      <strong>{formatPoints(order.pointsEarned)}</strong>
                    </Box>
                    <Box>
                      <span>القطع</span>
                      <strong>{formatUiNumber(order.itemsCount || 0)}</strong>
                    </Box>
                    <Box>
                      <span>الإجمالي</span>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                    </Box>
                  </Box>

                  <Box className="customer-order-card__footer">
                    <Typography variant="body2" color="text.secondary">
                      {formatUiDateTime(order.createdAt)}
                    </Typography>
                    {order.couponCode ? (
                      <Chip size="small" variant="outlined" label={order.couponCode} />
                    ) : null}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <EmptyState
            title="لا توجد طلبات بعد"
            description="ابدأ التسوق، وسيظهر رصيد النقاط هنا بعد أول طلب."
            action={
              <AppButton component={RouterLink} to={productsPath} variant="contained">
                تصفح المنتجات
              </AppButton>
            }
          />
        )}
      </Box>
    </Box>
  );
}
