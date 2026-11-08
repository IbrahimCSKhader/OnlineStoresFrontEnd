import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import superAdminDashboardApi from "../API/superAdminDashboard.api.js";
import AppButton from "../components/common/buttons/AppButton.jsx";
import LoadingState from "../components/common/loaders/LoadingState.jsx";
import AdminFeedbackSnackbar from "../components/admin/AdminFeedbackSnackbar.jsx";
import { SITE_BRAND_ASSET_PATH } from "../constants/siteBranding.js";
import useAuth from "../hooks/auth/useAuth.js";
import useLogout from "../hooks/auth/useLogout.js";
import { getInitials } from "../utils/adminDashboard.js";
import extractApiError from "../utils/extractApiError.js";
import { isSuperAdminRole } from "../utils/roles.js";
import "./SuperAdminLayout.css";

const navigation = [
  { to: "/dashboard", label: "نظرة عامة", description: "مؤشرات المنصة والوصول السريع", icon: DashboardRoundedIcon },
  { to: "/dashboard/stores", label: "المتاجر", description: "إدارة المتاجر والواجهات والكتالوج والطلبات", icon: StorefrontRoundedIcon },
  { to: "/dashboard/owners", label: "الملاك", description: "حسابات أصحاب المتاجر وصلاحيات الوصول", icon: PeopleAltRoundedIcon },
  { to: "/dashboard/plans", label: "الباقات", description: "الأسعار وحدود الاستخدام ومزايا الاشتراك", icon: LayersRoundedIcon },
  { to: "/dashboard/system", label: "الصيانة", description: "إدارة تخزين صور المنتجات والمتغيرات", icon: DnsRoundedIcon },
];

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPlatformAuthenticated, platformRole, platformToken, platformUser } = useAuth();
  const isAdmin = isPlatformAuthenticated && isSuperAdminRole(platformRole);
  const access = useQuery({
    queryKey: ["super-admin", "private-access", platformUser?.id ?? platformUser?.email],
    queryFn: ({ signal }) => superAdminDashboardApi.verifyPrivateAccess(platformToken, signal),
    enabled: isAdmin,
    retry: false,
    gcTime: 0,
  });
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });
  const returnToLogin = () => navigate("/secretelogin", { replace: true });
  const logout = useLogout({ onSuccess: returnToLogin, onError: returnToLogin });

  if (!isAdmin) {
    return <Navigate to="/secretelogin" replace state={{ redirectTo: location.pathname + location.search + location.hash }} />;
  }

  if (!access.isSuccess) {
    return (
      <Box className="super-admin-access" dir="rtl">
        {access.isPending ? <LoadingState label="جارٍ التحقق من صلاحية الدخول..." /> : (
          <Stack spacing={2} alignItems="start">
            <Alert severity="error">
              {access.error?.response?.status === 403
                ? "الدخول مخصص لحساب الإدارة المعتمد."
                : extractApiError(access.error, "تعذر التحقق من الوصول إلى لوحة الإدارة.")}
            </Alert>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <AppButton variant="outlined" onClick={() => access.refetch()} loading={access.isFetching}>إعادة المحاولة</AppButton>
              <AppButton onClick={() => logout.mutate()} loading={logout.isPending}>تبديل الحساب</AppButton>
            </Stack>
          </Stack>
        )}
      </Box>
    );
  }

  const page = navigation.find(({ to }) => location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to + "/"))) ?? navigation[0];
  const displayName = platformUser?.fullName || [platformUser?.firstName, platformUser?.lastName].filter(Boolean).join(" ") || "مدير المنصة";

  return (
    <Box className="super-admin-shell" dir="rtl">
      <meta name="robots" content="noindex, nofollow" />
      <aside className="super-admin-shell__sidebar">
        <NavLink to="/dashboard" className="super-admin-sidebar__brand">
          <img src={SITE_BRAND_ASSET_PATH} alt="" width="42" height="42" />
          <span><strong>موجة</strong><small>إدارة المنصة</small></span>
        </NavLink>
        <nav className="super-admin-sidebar__nav" aria-label="أقسام لوحة الإدارة">
          {navigation.map(({ to, label, icon }) => {
            const Icon = icon;
            return (
              <NavLink key={to} to={to} end={to === "/dashboard"} className="super-admin-sidebar__link">
                <Icon fontSize="small" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="super-admin-sidebar__footer">لوحة الإدارة الخاصة</div>
      </aside>

      <div className="super-admin-shell__main">
        <header className="super-admin-topbar">
          <div>
            <Typography component="h1" variant="h4" className="super-admin-topbar__title">{page.label}</Typography>
            <Typography variant="body2" color="text.secondary">{page.description}</Typography>
          </div>
          <div className="super-admin-topbar__actions">
            <Avatar className="super-admin-topbar__avatar">{getInitials(displayName, "مد")}</Avatar>
            <div className="super-admin-topbar__identity">
              <Typography variant="subtitle2">{displayName}</Typography>
              <Typography variant="caption" color="text.secondary">مدير المنصة</Typography>
            </div>
            <AppButton variant="outlined" size="small" onClick={() => logout.mutate()} loading={logout.isPending} startIcon={<LogoutRoundedIcon fontSize="small" />}>
              تسجيل الخروج
            </AppButton>
          </div>
        </header>
        <main className="super-admin-shell__content">
          <Outlet context={{ notify: ({ severity = "success", message }) => setToast({ open: true, severity, message }) }} />
        </main>
      </div>
      <AdminFeedbackSnackbar toast={toast} onClose={() => setToast((current) => ({ ...current, open: false }))} />
    </Box>
  );
}
