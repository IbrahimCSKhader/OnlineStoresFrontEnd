import { Link, NavLink, Navigate, useOutletContext, useParams } from "react-router-dom";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { CustomerAccount } from "../../components/dashboard/CustomerAccounts.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import useSuperAdminStoreWorkspace from "../../hooks/superAdmin/useSuperAdminStoreWorkspace.js";
import useStoreReviews from "../../hooks/reviews/useStoreReviews.js";
import useUpdateReviewApproval from "../../hooks/reviews/useUpdateReviewApproval.js";
import { normalizeEntityResponse, normalizeListResponse } from "../../utils/collections.js";
import { canUseStoreCoupons } from "../../utils/storeCoupons.js";
import extractApiError from "../../utils/extractApiError.js";
import OwnerDashboard from "../owner/Dashboard.jsx";
import OrderDetailsPage from "../owner/OrderDetailsPage.jsx";
import StoreSubscriptions from "./StoreSubscriptions.jsx";
import "./SuperAdminPages.css";

const tabs = [
  ["products", "المنتجات"],
  ["categories", "التصنيفات"],
  ["sections", "الأقسام"],
  ["offers", "العروض"],
  ["orders", "الطلبات"],
  ["customers", "العملاء"],
  ["coupons", "الكوبونات"],
  ["reviews", "التقييمات"],
  ["subscriptions", "الاشتراكات"],
];

function StoreReviews({ storeId }) {
  const query = useStoreReviews(storeId);
  const { notify } = useOutletContext();
  const approval = useUpdateReviewApproval(storeId, {
    onSuccess: () => notify({ message: "تم تحديث حالة التقييم." }),
  });
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <Alert severity="error">{extractApiError(query.error, "تعذر تحميل التقييمات.")}</Alert>;
  const reviews = normalizeListResponse(query.data);
  return (
    <Stack spacing={2}>
      {approval.isError && <Alert severity="error">{extractApiError(approval.error, "تعذر تحديث حالة التقييم.")}</Alert>}
      {reviews.length === 0 && <Alert severity="info">لا توجد تقييمات لهذا المتجر.</Alert>}
      {reviews.map((review) => (
        <Paper key={review.id} className="super-admin-panel" elevation={0}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
            <Stack spacing={0.5}>
              <Typography fontWeight={700}>{review.storeCustomerFullName || "عميل المتجر"} · {review.rating}/5</Typography>
              {review.comment && <Typography sx={{ overflowWrap: "anywhere" }}>{review.comment}</Typography>}
              <Typography color="text.secondary" variant="body2">{review.isApproved ? "منشور" : "بانتظار الموافقة"}</Typography>
            </Stack>
            <Button variant="outlined" disabled={approval.isPending} onClick={() => approval.mutate({ reviewId: review.id, payload: { isApproved: !review.isApproved } })}>
              {review.isApproved ? "إخفاء التقييم" : "نشر التقييم"}
            </Button>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export default function StoreWorkspace({ detail }) {
  const { storeId, tab = "products", customerId } = useParams();
  const query = useSuperAdminStoreWorkspace(storeId);
  const store = normalizeEntityResponse(query.data);
  const settingsPath = `/dashboard/stores/${storeId}`;
  const managementBasePath = settingsPath + "/manage";
  const selectedTab = detail || tab;

  if (query.isPending) return <LoadingState label="جارٍ تحميل بيانات المتجر..." />;
  if (query.isError || !store?.id) return (
    <Alert severity="error" action={<Button component={Link} to="/dashboard/stores">المتاجر</Button>}>
      {extractApiError(query.error, "تعذر تحميل بيانات المتجر.")}
    </Alert>
  );

  const availableTabs = tabs.filter(([key]) =>
    (key !== "coupons" || canUseStoreCoupons(store)) &&
    (!store.isCatalog || !["orders", "customers"].includes(key))
  );
  if (!availableTabs.some(([key]) => key === selectedTab)) return <Navigate to={managementBasePath + "/products"} replace />;

  return (
    <Stack spacing={2}>
      <Paper className="super-admin-panel super-admin-workspace" elevation={0}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
          <div>
            <Typography variant="overline" color="text.secondary">إدارة عمليات المتجر</Typography>
            <Typography component="h2" variant="h5">{store.name}</Typography>
          </div>
          <Button component={Link} to={settingsPath} variant="outlined">ملخص المتجر وإعداداته</Button>
        </Stack>
        <nav className="super-admin-workspace__nav" aria-label="عمليات المتجر">
          {availableTabs.map(([key, label]) => (
            <NavLink key={key} to={managementBasePath + "/" + key}>{label}</NavLink>
          ))}
        </nav>
      </Paper>
      {detail === "orders" ? <OrderDetailsPage key={storeId} managedStore={store} managementBasePath={managementBasePath} />
        : detail === "customers" ? <CustomerAccount key={customerId} storeId={storeId} customerId={customerId} managementBasePath={managementBasePath} />
        : tab === "reviews" ? <StoreReviews key={storeId} storeId={storeId} />
        : tab === "subscriptions" ? <StoreSubscriptions key={storeId} storeId={storeId} />
        : <OwnerDashboard key={storeId + ":" + tab} initialTab={tab} managedStore={store} managementBasePath={managementBasePath} />}
    </Stack>
  );
}
