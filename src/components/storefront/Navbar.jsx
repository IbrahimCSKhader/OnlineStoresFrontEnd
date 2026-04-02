import { useMemo, useState } from "react";
import {
  NavLink,
  matchPath,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../common/buttons/AppButton.jsx";
import { useAppThemeVariant } from "../../theme/AppThemeProvider.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useCart from "../../hooks/cart/useCart.js";
import useLogout from "../../hooks/auth/useLogout.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import {
  getLandingPath,
  isOwnerRole,
  isSuperAdminRole,
} from "../../utils/roles.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import "./Navbar.css";

const navItems = [
  { to: "/", label: "الرئيسية" },
  { to: "/market", label: "المتاجر" },
  { to: "/about", label: "عن المنصة" },
  { to: "/contact", label: "تواصل معنا" },
];

const themeOptions = [
  {
    value: "light",
    label: "الوضع الفاتح",
    icon: <LightModeRoundedIcon />,
  },
  {
    value: "dark",
    label: "الوضع الداكن",
    icon: <DarkModeRoundedIcon />,
  },
  {
    value: "nature",
    label: "الوضع الأخضر",
    icon: <ParkRoundedIcon />,
  },
];

function ThemeToggleButton({ variant, onSelect, className }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const activeTheme = themeOptions.find((option) => option.value === variant) ?? themeOptions[0];

  return (
    <>
      <IconButton
        className={["store-navbar__icon-button", className || ""].filter(Boolean).join(" ")}
        aria-label="الثيمات"
        aria-controls={menuOpen ? "theme-picker-menu" : undefined}
        aria-expanded={menuOpen ? "true" : undefined}
        aria-haspopup="menu"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {activeTheme.icon}
      </IconButton>

      <Menu
        id="theme-picker-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "store-navbar__theme-menu" }}
        MenuListProps={{
          className: "store-navbar__theme-menu-list",
          "aria-label": "خيارات الثيم",
        }}
      >
        <Box className="store-navbar__theme-options">
          {themeOptions.map((option) => (
            <IconButton
              key={option.value}
              className={[
                "store-navbar__theme-option",
                option.value === variant ? "store-navbar__theme-option--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={option.label}
              title={option.label}
              onClick={() => {
                onSelect(option.value);
                setAnchorEl(null);
              }}
            >
              {option.icon}
            </IconButton>
          ))}
        </Box>
      </Menu>
    </>
  );
}

function NavLinks({ onNavigate, drawer = false }) {
  const location = useLocation();

  return navItems.map((item) => {
    const isActive =
      location.pathname === item.to ||
      (item.to !== "/" && location.pathname.startsWith(`${item.to}/`));

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={[
          "store-navbar__link",
          isActive ? "store-navbar__link--active" : "",
          drawer ? "store-navbar__link--drawer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onNavigate}
      >
        {item.label}
      </NavLink>
    );
  });
}

export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { variant, setVariant } = useAppThemeVariant();
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logoutMutation = useLogout({
    onSettled: () => {
      navigate("/market", { replace: true });
    },
  });

  const storeRouteMatch = useMemo(
    () =>
      matchPath("/market/:slug/*", location.pathname) ??
      matchPath("/market/:slug", location.pathname),
    [location.pathname],
  );
  const activeStoreSlug = storeRouteMatch?.params?.slug;
  const storeQuery = useStoreBySlug(activeStoreSlug, {
    enabled: Boolean(activeStoreSlug),
    staleTime: 60000,
  });
  const activeStore = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );
  const activeStoreLogo = resolveAssetUrl(activeStore?.logoUrl);
  const brandHref = activeStoreSlug ? `/market/${activeStoreSlug}` : "/";
  const brandEyebrow = activeStore ? "واجهة المتجر" : "Premium storefront";
  const brandName = activeStore?.name || "Online Storefront";
  const shouldShowCartAction =
    isAuthenticated &&
    !isOwnerRole(role) &&
    !isSuperAdminRole(role) &&
    Boolean(activeStoreSlug);
  const cartQuery = useCart(activeStore?.id, {
    enabled: shouldShowCartAction && Boolean(activeStore?.id),
    staleTime: 30000,
  });
  const cart = useMemo(() => normalizeCartResponse(cartQuery.data), [cartQuery.data]);
  const cartItemCount = cart.itemCount || 0;
  const cartPath = activeStoreSlug ? `/market/${activeStoreSlug}/cart` : "/market";

  const dashboardPath = getLandingPath(role);
  const dashboardLabel = isSuperAdminRole(role)
    ? "لوحة الإدارة"
    : isOwnerRole(role)
      ? "إدارة المتجر"
      : "مساحتي";

  const renderBrandVisual = (drawer = false) => {
    if (activeStoreLogo) {
      return (
        <img
          src={activeStoreLogo}
          alt={`${brandName} logo`}
          className={[
            "store-navbar__brand-logo",
            drawer ? "store-navbar__brand-logo--drawer" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      );
    }

    return (
      <Box
        className={[
          "store-navbar__brand-mark",
          drawer ? "store-navbar__brand-mark--drawer" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      >
        <StorefrontRoundedIcon fontSize="small" />
      </Box>
    );
  };

  const renderAuthButtons = (drawer = false) =>
    isAuthenticated ? (
      <>
        <AppButton
          component={NavLink}
          to={dashboardPath}
          onClick={drawer ? () => setDrawerOpen(false) : undefined}
          variant="contained"
          startIcon={<DashboardRoundedIcon fontSize="small" />}
          fullWidth={drawer}
        >
          {dashboardLabel}
        </AppButton>
        <AppButton
          variant={drawer ? "outlined" : "text"}
          appearance={drawer ? "secondary" : "ghost"}
          startIcon={<LogoutRoundedIcon fontSize="small" />}
          onClick={() => {
            if (drawer) {
              setDrawerOpen(false);
            }
            logoutMutation.mutate();
          }}
          loading={logoutMutation.isPending}
          loadingLabel="جارٍ تسجيل الخروج..."
          fullWidth={drawer}
        >
          تسجيل الخروج
        </AppButton>
      </>
    ) : (
      <>
        <AppButton
          component={NavLink}
          to="/auth/login"
          onClick={drawer ? () => setDrawerOpen(false) : undefined}
          variant={drawer ? "outlined" : "text"}
          appearance={drawer ? "secondary" : "ghost"}
          fullWidth={drawer}
        >
          تسجيل الدخول
        </AppButton>
        <AppButton
          component={NavLink}
          to="/auth/register"
          onClick={drawer ? () => setDrawerOpen(false) : undefined}
          variant="contained"
          fullWidth={drawer}
        >
          إنشاء حساب
        </AppButton>
      </>
    );

  const renderCartButton = (drawer = false) => {
    if (!shouldShowCartAction) return null;

    const cartIcon = (
      <Badge
        badgeContent={cartItemCount}
        color="primary"
        overlap="circular"
        invisible={!cartItemCount}
      >
        <ShoppingCartRoundedIcon fontSize="small" />
      </Badge>
    );

    if (drawer) {
      return (
        <AppButton
          component={NavLink}
          to={cartPath}
          onClick={() => setDrawerOpen(false)}
          variant="outlined"
          startIcon={cartIcon}
          fullWidth
        >
          السلة
        </AppButton>
      );
    }

    return (
      <IconButton
        component={NavLink}
        to={cartPath}
        className="store-navbar__icon-button store-navbar__cart-button"
        aria-label="السلة"
      >
        {cartIcon}
      </IconButton>
    );
  };

  return (
    <AppBar position="sticky" component="header" className="store-navbar">
      <Toolbar className="store-navbar__toolbar" disableGutters>
        <Box component={NavLink} to={brandHref} className="store-navbar__brand">
          {renderBrandVisual()}

          <Box className="store-navbar__brand-text">
            <Typography variant="overline" className="store-navbar__eyebrow">
              {brandEyebrow}
            </Typography>
            <Typography component="span" className="store-navbar__brand-name">
              {brandName}
            </Typography>
          </Box>
        </Box>

        {!isMobile ? (
          <Box component="nav" className="store-navbar__nav" aria-label="التنقل الرئيسي">
            <NavLinks />
          </Box>
        ) : (
          <Box className="store-navbar__spacer" />
        )}

        <Box className="store-navbar__actions">
          <ThemeToggleButton variant={variant} onSelect={setVariant} />
          {renderCartButton()}

          {!isMobile ? (
            <Stack direction="row" spacing={1} className="store-navbar__auth-wrap">
              {renderAuthButtons()}
            </Stack>
          ) : (
            <IconButton
              className="store-navbar__icon-button"
              aria-label="فتح القائمة"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ className: "store-navbar__drawer" }}
      >
        <Box className="store-navbar__drawer-head">
          <Box className="store-navbar__drawer-brand">
            {renderBrandVisual(true)}
            <Box>
              <Typography variant="subtitle2">{brandName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {activeStore ? "التنقل داخل المتجر" : "تجربة تسوق أنيقة وسريعة"}
              </Typography>
            </Box>
          </Box>

          <Box className="store-navbar__drawer-head-actions">
            <ThemeToggleButton variant={variant} onSelect={setVariant} />
            <IconButton
              className="store-navbar__icon-button"
              onClick={() => setDrawerOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Box className="store-navbar__drawer-section">
          <Typography variant="overline" className="storefront-eyebrow">
            التنقل
          </Typography>
            <Box className="store-navbar__drawer-links">
              <NavLinks drawer onNavigate={() => setDrawerOpen(false)} />
            </Box>
          </Box>

          {shouldShowCartAction ? (
            <Box className="store-navbar__drawer-section">
              <Typography variant="overline" className="storefront-eyebrow">
                السلة
              </Typography>
              <Stack spacing={1.25}>{renderCartButton(true)}</Stack>
            </Box>
          ) : null}

          <Box className="store-navbar__drawer-section">
          <Typography variant="overline" className="storefront-eyebrow">
            الحساب
          </Typography>
          <Stack spacing={1.25}>{renderAuthButtons(true)}</Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}
