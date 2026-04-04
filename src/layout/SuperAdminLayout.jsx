import { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../components/common/buttons/AppButton.jsx";
import AdminFeedbackSnackbar from "../components/admin/AdminFeedbackSnackbar.jsx";
import useAuth from "../hooks/auth/useAuth.js";
import useLogout from "../hooks/auth/useLogout.js";
import { getInitials } from "../utils/adminDashboard.js";
import { getLandingPath, isSuperAdminRole } from "../utils/roles.js";
import "./SuperAdminLayout.css";

const NAV_ITEMS = [
  {
    label: "نظرة عامة",
    description: "ملخص المنصة والإحصاءات السريعة",
    icon: <DashboardRoundedIcon fontSize="small" />,
    to: "/dashboard",
    match: ["/dashboard"],
  },
  {
    label: "أصحاب المتاجر",
    description: "حسابات الملاك والمتاجر التابعة لهم",
    icon: <PeopleAltRoundedIcon fontSize="small" />,
    to: "/dashboard/owners",
    match: ["/dashboard/owners"],
  },
  {
    label: "المتاجر",
    description: "تفاصيل المتاجر والعملاء والحالة",
    icon: <StorefrontRoundedIcon fontSize="small" />,
    to: "/dashboard/stores",
    match: ["/dashboard/stores"],
  },
];

function resolvePageMeta(pathname) {
  if (pathname.startsWith("/dashboard/stores/")) {
    return {
      title: "تفاصيل المتجر",
      description: "استعرض بيانات المتجر والمالك والعملاء وحسابات التواصل.",
    };
  }

  const currentItem = NAV_ITEMS.find((item) => item.match.some((match) => pathname === match));

  if (currentItem) {
    return {
      title: currentItem.label,
      description: currentItem.description,
    };
  }

  return {
    title: "لوحة السوبر أدمن",
    description: "إدارة المنصة",
  };
}

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, user } = useAuth();
  const [toast, setToast] = useState({
    open: false,
    severity: "success",
    message: "",
  });
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate("/admin/login", { replace: true });
    },
    onError: () => {
      navigate("/admin/login", { replace: true });
    },
  });

  const effectiveRole = role || user?.accountType;
  const isSuperAdmin = isSuperAdminRole(effectiveRole);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ redirectTo: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to={getLandingPath(effectiveRole)} replace />;
  }

  const pageMeta = resolvePageMeta(location.pathname);
  const displayName =
    user?.fullName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    "سوبر أدمن";

  const notify = (payload) => {
    setToast({
      open: true,
      severity: payload?.severity || "success",
      message: payload?.message || "",
    });
  };

  return (
    <>
      <Box className="super-admin-shell" dir="rtl">
        <Box className="super-admin-shell__sidebar">
          <Box className="super-admin-sidebar">
            <Stack spacing={1.1}>
              <Typography variant="overline" className="super-admin-sidebar__eyebrow">
                تحكم المنصة
              </Typography>
              <Typography variant="h5" className="super-admin-sidebar__title">
                لوحة السوبر أدمن
              </Typography>
              <Typography variant="body2" color="text.secondary">
                من هنا يمكنك إدارة الملاك، والمتاجر، وعملاء المتاجر من مكان واحد.
              </Typography>
            </Stack>

            <Stack spacing={1.1} className="super-admin-sidebar__nav">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) =>
                    [
                      "super-admin-sidebar__link",
                      isActive ? "super-admin-sidebar__link--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <Box className="super-admin-sidebar__icon" aria-hidden>
                    {item.icon}
                  </Box>
                  <Box className="super-admin-sidebar__copy">
                    <Typography variant="subtitle2">{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.description}
                    </Typography>
                  </Box>
                </NavLink>
              ))}
            </Stack>
          </Box>
        </Box>

        <Box className="super-admin-shell__main">
          <Box className="super-admin-topbar">
            <Box>
              <Typography variant="h4" className="super-admin-topbar__title">
                {pageMeta.title || "لوحة السوبر أدمن"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pageMeta.description || "إدارة المنصة"}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              className="super-admin-topbar__actions"
            >
              <Chip label="SuperAdmin" color="primary" variant="outlined" />
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar className="super-admin-topbar__avatar">
                  {getInitials(displayName, "سا")}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">{displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || "حساب موثّق"}
                  </Typography>
                </Box>
              </Stack>

              <AppButton
                variant="outlined"
                onClick={() => logoutMutation.mutate()}
                loading={logoutMutation.isPending}
                startIcon={<LogoutRoundedIcon fontSize="small" />}
              >
                تسجيل الخروج
              </AppButton>
            </Stack>
          </Box>

          <Box className="super-admin-shell__content">
            <Outlet context={{ notify }} />
          </Box>
        </Box>
      </Box>

      <AdminFeedbackSnackbar
        toast={toast}
        onClose={() =>
          setToast((current) => ({
            ...current,
            open: false,
          }))
        }
      />
    </>
  );
}
