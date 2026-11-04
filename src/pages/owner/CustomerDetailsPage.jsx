import { Link, Navigate, useParams } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import useAuth from "../../hooks/auth/useAuth.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import { isOwnerRole, isSuperAdminRole } from "../../utils/roles.js";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import { CustomerAccount } from "../../components/dashboard/CustomerAccounts.jsx";
import "./OwnerDashboard.css";

export default function CustomerDetailsPage() {
  const { customerId } = useParams(); const { isAuthenticated, role } = useAuth(); const { t } = useOwnerLanguage();
  const owner = isOwnerRole(role);
  const query = useOwnerStore({ enabled: isAuthenticated && owner, refetchOnWindowFocus: false });
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!owner) return <Navigate to={isSuperAdminRole(role) ? "/dashboard" : "/"} replace />;
  if (query.isLoading) return <LoadingState />;
  const store = query.ownerStore;
  if (!store || store.isCatalog) return <Navigate to="/owner" replace />;
  return <DashboardLayout sidebar={<Paper className="owner-sidebar" elevation={0}><Stack spacing={2}>
    <Typography variant="h5">{store.name}</Typography><Typography>{t("حساب العميل وكشف الحساب")}</Typography>
    <Button component={Link} to="/owner/customers" variant="contained">{t("العودة إلى العملاء")}</Button>
    <Button component={Link} to="/owner/orders">{t("الطلبات")}</Button>
  </Stack></Paper>}><Box className="owner-dashboard owner-detail-shell"><CustomerAccount key={customerId} storeId={store.id} customerId={customerId} /></Box></DashboardLayout>;
}
