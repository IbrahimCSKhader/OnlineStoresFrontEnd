import { useMemo, useState } from "react";
import { NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../common/buttons/AppButton.jsx";
import ContactDeveloperButton from "../common/ContactDeveloperButton.jsx";
import { useAppThemeVariant } from "../../theme/AppThemeProvider.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useCart from "../../hooks/cart/useCart.js";
import useLogout from "../../hooks/auth/useLogout.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import {
  getLandingPath,
  isOwnerRole,
  isSuperAdminRole,
} from "../../utils/roles.js";
import { buildStoreCustomerAuthState } from "../../utils/storeCustomerAuth.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import "./Navbar.css";

function buildNavItems(activeStoreSlug) {
  if (activeStoreSlug) {
    return [
      { to: `/market/${activeStoreSlug}`, label: "الرئيسية", exact: true },
      { to: `/market/${activeStoreSlug}/about`, label: "من نحن" },
      { to: `/market/${activeStoreSlug}/contact`, label: "تواصل" },
    ];
  }

  return [
    { to: "/", label: "الرئيسية", exact: true },
    { to: "/market", label: "المتاجر" },
    { to: "/about", label: "من نحن" },
    { to: "/contact", label: "تواصل" },
  ];
}

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

function getCustomerInitials(user) {
  return [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((value) => String(value).trim()[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ThemeToggleButton({ variant, onSelect, className }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const activeTheme =
    themeOptions.find((option) => option.value === variant) ?? themeOptions[0];

  return (
    <>
      <IconButton
        className={["store-navbar__icon-button", className || ""]
          .filter(Boolean)
          .join(" ")}
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
                option.value === variant
                  ? "store-navbar__theme-option--active"
                  : "",
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

function NavLinks({ items, onNavigate, drawer = false, resolveTo }) {
  const location = useLocation();

  return items.map((item) => {
    const isActive =
      location.pathname === item.to ||
      (!item.exact &&
        item.to !== "/" &&
        location.pathname.startsWith(`${item.to}/`));

    return (
      <NavLink
        key={item.to}
        to={resolveTo ? resolveTo(item.to) : item.to}
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
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const { variant, setVariant } = useAppThemeVariant();
  const {
    isAuthenticated,
    isPlatformAuthenticated,
    isStoreCustomer,
    role,
    platformRole,
    platformUser,
    storeCustomer,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOwnerPreview, buildStorePreviewPath } = useOwnerStorePreview();
  const profileMenuOpen = Boolean(profileAnchorEl);
  const isOwnerDashboardRoute = location.pathname.startsWith("/owner");

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
  const isOwnerPlatformUser =
    isPlatformAuthenticated && isOwnerRole(platformRole);
  const ownerUserStoreId = String(
    platformUser?.storeId || platformUser?.StoreId || platformUser?.store?.id || "",
  ).trim();
  const ownerStoreQuery = useOwnerStore({
    enabled:
      isOwnerPlatformUser &&
      (isOwnerDashboardRoute || (Boolean(activeStoreSlug) && !ownerUserStoreId)),
    staleTime: 60000,
  });
  const ownerStore = ownerStoreQuery.ownerStore;
  const isScopedOwnerDashboard =
    isOwnerDashboardRoute && isOwnerPlatformUser;
  const ownerScopedStoreId = String(
    ownerStore?.id || ownerUserStoreId || "",
  ).trim();
  const activeStoreId = String(activeStore?.id || "").trim();
  const isViewingOwnedStore =
    Boolean(activeStoreId) &&
    Boolean(ownerScopedStoreId) &&
    activeStoreId === ownerScopedStoreId;
  const canShowPlatformDashboardButton =
    isPlatformAuthenticated &&
    (isSuperAdminRole(platformRole) || isViewingOwnedStore);
  const currentBrandStore = isScopedOwnerDashboard ? ownerStore : activeStore;
  const activeStoreLogo = resolveAssetUrl(currentBrandStore?.logoUrl);
  const brandHref = isScopedOwnerDashboard
    ? "/owner"
    : activeStoreSlug
      ? buildStorePreviewPath(`/market/${activeStoreSlug}`)
      : "/";
  const brandEyebrow = isScopedOwnerDashboard ? "لوحة المتجر" : "";
  const brandName = activeStore?.name || "السوق";
  const resolvedBrandName =
    currentBrandStore?.name || (isScopedOwnerDashboard ? "متجرك" : brandName);
  const navItems = useMemo(
    () => (isScopedOwnerDashboard ? [] : buildNavItems(activeStoreSlug)),
    [activeStoreSlug, isScopedOwnerDashboard],
  );
  const loginPath = activeStoreSlug
    ? `/market/${activeStoreSlug}/login`
    : "/auth/login";
  const registerPath = activeStoreSlug
    ? `/market/${activeStoreSlug}/register`
    : "/auth/register";
  const cartPath = activeStoreSlug
    ? buildStorePreviewPath(`/market/${activeStoreSlug}/cart`)
    : "/market";
  const { hasScopedStorefrontSession, useLocalGuestCart } =
    useStorefrontSession(activeStore?.id);

  const isStoreCustomerSignedIn =
    !isOwnerPreview &&
    Boolean(activeStoreSlug) &&
    isAuthenticated &&
    isStoreCustomer &&
    hasScopedStorefrontSession;
  const canAccessStoreCart = Boolean(activeStoreSlug) && !isOwnerPreview;

  const logoutMutation = useLogout({
    onSettled: () => {
      const nextPath = isScopedOwnerDashboard
        ? ownerStore?.slug
          ? `/market/${ownerStore.slug}`
          : "/"
        : activeStoreSlug
          ? `/market/${activeStoreSlug}`
          : "/";
      navigate(nextPath, { replace: true });
    },
  });

  const cartQuery = useCart(activeStore?.id, {
    enabled: canAccessStoreCart && Boolean(activeStore?.id),
    autoCreateSession: false,
    staleTime: 30000,
  });
  const cart = useMemo(
    () => normalizeCartResponse(cartQuery.data),
    [cartQuery.data],
  );
  const cartItemCount =
    hasScopedStorefrontSession || useLocalGuestCart ? cart.itemCount || 0 : 0;

  const storeCustomerAuthState =
    activeStore?.id && activeStoreSlug
      ? buildStoreCustomerAuthState({
          storeId: activeStore.id,
          storeSlug: activeStoreSlug,
          storeName: activeStore.name,
          redirectTo: location.pathname,
        })
      : undefined;

  const dashboardPath = getLandingPath(platformRole);
  const dashboardLabel = isSuperAdminRole(platformRole)
    ? "لوحة الإدارة"
    : isOwnerRole(platformRole)
      ? "إدارة المتجر"
      : "داخل المتجر";

  const customerDisplayName =
    storeCustomer?.fullName?.trim() ||
    [storeCustomer?.firstName, storeCustomer?.lastName].filter(Boolean).join(" ").trim() ||
    "الزبون";
  const customerEmail = storeCustomer?.email || "";
  const customerStoreLabel =
    currentBrandStore?.name || storeCustomerAuthState?.storeName || "";
  const customerInitials = getCustomerInitials(storeCustomer);

  const closeProfileMenu = () => setProfileAnchorEl(null);

  const handleLogout = () => {
    closeProfileMenu();
    setDrawerOpen(false);
    logoutMutation.mutate();
  };

  const renderBrandVisual = (drawer = false) => {
    if (activeStoreLogo) {
      return (
        <img
          src={activeStoreLogo}
          alt={`${resolvedBrandName} logo`}
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

  const renderCartButton = (drawer = false) => {
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
      if (!activeStoreSlug) return null;

      if (isOwnerPreview) {
        return (
          <AppButton
            variant="outlined"
            startIcon={<ShoppingCartRoundedIcon fontSize="small" />}
            fullWidth
            disabled
          >
            السلة
          </AppButton>
        );
      }

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

    if (!activeStoreSlug) return null;

    if (isOwnerPreview) {
      return (
        <IconButton
          className="store-navbar__icon-button store-navbar__cart-button"
          aria-label="السلة معطلة في وضع المعاينة"
          disabled
        >
          {cartIcon}
        </IconButton>
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

  const renderStoreCustomerProfileMenu = () => {
    if (!isStoreCustomerSignedIn) {
      return null;
    }

    return (
      <>
        <IconButton
          className="store-navbar__profile-trigger"
          aria-label="بيانات الحساب"
          aria-controls={
            profileMenuOpen ? "store-customer-profile-menu" : undefined
          }
          aria-expanded={profileMenuOpen ? "true" : undefined}
          aria-haspopup="menu"
          onClick={(event) => setProfileAnchorEl(event.currentTarget)}
        >
          <Avatar className="store-navbar__profile-avatar">
            {customerInitials || <PersonRoundedIcon fontSize="small" />}
          </Avatar>
        </IconButton>

        <Menu
          id="store-customer-profile-menu"
          anchorEl={profileAnchorEl}
          open={profileMenuOpen}
          onClose={closeProfileMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ className: "store-navbar__profile-menu" }}
          MenuListProps={{
            className: "store-navbar__profile-menu-list",
            "aria-label": "بيانات حساب الزبون",
          }}
        >
          <Box className="store-navbar__profile-menu-head">
            <Avatar className="store-navbar__profile-avatar store-navbar__profile-avatar--large">
              {customerInitials || <PersonRoundedIcon fontSize="small" />}
            </Avatar>
            <Box className="store-navbar__profile-copy">
              <Typography
                variant="subtitle2"
                className="store-navbar__profile-name"
              >
                {customerDisplayName}
              </Typography>
              {customerEmail ? (
                <Typography variant="caption" color="text.secondary">
                  {customerEmail}
                </Typography>
              ) : null}
            </Box>
          </Box>

          {customerStoreLabel || storeCustomer?.storeCustomerId ? <Divider /> : null}

          {customerStoreLabel ? (
            <Box className="store-navbar__profile-info">
              <StorefrontRoundedIcon fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  المتجر الحالي
                </Typography>
                <Typography variant="body2">{customerStoreLabel}</Typography>
              </Box>
            </Box>
          ) : null}

          {customerEmail ? (
            <Box className="store-navbar__profile-info">
              <EmailRoundedIcon fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  البريد الإلكتروني
                </Typography>
                <Typography variant="body2">{customerEmail}</Typography>
              </Box>
            </Box>
          ) : null}

          {storeCustomer?.storeCustomerId ? (
            <Box className="store-navbar__profile-info">
              <PersonRoundedIcon fontSize="small" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  رقم الحساب
                </Typography>
                <Typography
                  variant="body2"
                  className="store-navbar__profile-id"
                >
                  {String(storeCustomer.storeCustomerId).slice(0, 8)}
                </Typography>
              </Box>
            </Box>
          ) : null}

          <Divider />

          <MenuItem
            component={NavLink}
            to={cartPath}
            onClick={closeProfileMenu}
            className="store-navbar__profile-item"
          >
            <ListItemIcon>
              <ShoppingCartRoundedIcon fontSize="small" />
            </ListItemIcon>
            السلة
          </MenuItem>

          <MenuItem
            component={NavLink}
            to={brandHref}
            onClick={closeProfileMenu}
            className="store-navbar__profile-item"
          >
            <ListItemIcon>
              <StorefrontRoundedIcon fontSize="small" />
            </ListItemIcon>
            واجهة المتجر
          </MenuItem>

          <MenuItem
            onClick={handleLogout}
            className="store-navbar__profile-item"
          >
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            تسجيل الخروج
          </MenuItem>
        </Menu>
      </>
    );
  };

  const renderStoreCustomerDrawerPanel = () => {
    if (!isStoreCustomerSignedIn) {
      return null;
    }

    return (
      <Box className="store-navbar__profile-panel">
        <Box className="store-navbar__profile-panel-head">
          <Avatar className="store-navbar__profile-avatar store-navbar__profile-avatar--large">
            {customerInitials || <PersonRoundedIcon fontSize="small" />}
          </Avatar>
          <Box className="store-navbar__profile-copy">
            <Typography
              variant="subtitle2"
              className="store-navbar__profile-name"
            >
              {customerDisplayName}
            </Typography>
            {customerEmail ? (
              <Typography variant="caption" color="text.secondary">
                {customerEmail}
              </Typography>
            ) : null}
          </Box>
        </Box>

        {customerStoreLabel ? (
          <Typography variant="body2" color="text.secondary">
            {customerStoreLabel}
          </Typography>
        ) : null}

        <Stack spacing={1}>
          {renderCartButton(true)}
          <AppButton
            component={NavLink}
            to={brandHref}
            onClick={() => setDrawerOpen(false)}
            variant="outlined"
            startIcon={<StorefrontRoundedIcon fontSize="small" />}
            fullWidth
          >
            واجهة المتجر
          </AppButton>
          <AppButton
            variant="text"
            appearance="ghost"
            startIcon={<LogoutRoundedIcon fontSize="small" />}
            onClick={handleLogout}
            loading={logoutMutation.isPending}
            loadingLabel="جارٍ تسجيل الخروج..."
            fullWidth
          >
            تسجيل الخروج
          </AppButton>
        </Stack>
      </Box>
    );
  };

  const renderGuestButtons = (drawer = false) => (
    <>
      {drawer ? renderCartButton(true) : null}
      <AppButton
        component={NavLink}
        to={loginPath}
        state={storeCustomerAuthState}
        onClick={drawer ? () => setDrawerOpen(false) : undefined}
        variant={drawer ? "outlined" : "text"}
        appearance={drawer ? "secondary" : "ghost"}
        fullWidth={drawer}
      >
        تسجيل الدخول
      </AppButton>
      <AppButton
        component={NavLink}
        to={registerPath}
        state={storeCustomerAuthState}
        onClick={drawer ? () => setDrawerOpen(false) : undefined}
        variant="contained"
        fullWidth={drawer}
      >
        إنشاء حساب
      </AppButton>
    </>
  );

  const renderPlatformButtons = (drawer = false) => (
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
        onClick={handleLogout}
        loading={logoutMutation.isPending}
        loadingLabel="جارٍ تسجيل الخروج..."
        fullWidth={drawer}
      >
        تسجيل الخروج
      </AppButton>
    </>
  );

  const renderOwnerDashboardButtons = (drawer = false) => (
    <AppButton
      variant={drawer ? "outlined" : "text"}
      appearance={drawer ? "secondary" : "ghost"}
      startIcon={<LogoutRoundedIcon fontSize="small" />}
      onClick={handleLogout}
      loading={logoutMutation.isPending}
      loadingLabel="جاري تسجيل الخروج..."
      fullWidth={drawer}
    >
      تسجيل الخروج
    </AppButton>
  );

  const renderDesktopActions = () => {
    if (isOwnerPreview) {
      return renderPlatformButtons();
    }

    if (isStoreCustomerSignedIn) {
      return renderStoreCustomerProfileMenu();
    }

    if (isScopedOwnerDashboard) {
      return renderOwnerDashboardButtons();
    }

    if (isPlatformAuthenticated) {
      return canShowPlatformDashboardButton
        ? renderPlatformButtons()
        : renderOwnerDashboardButtons();
    }

    return renderGuestButtons();
  };

  const renderDrawerAccountSection = () => {
    const contactButton = (
      <ContactDeveloperButton
        label="الدعم"
        variant="outlined"
        fullWidth
        onClick={() => setDrawerOpen(false)}
      />
    );

    if (isOwnerPreview) {
      return (
        <>
          {contactButton}
          {renderPlatformButtons(true)}
        </>
      );
    }

    if (isStoreCustomerSignedIn) {
      return (
        <Stack spacing={1.25}>
          {contactButton}
          {renderStoreCustomerDrawerPanel()}
        </Stack>
      );
    }

    if (isScopedOwnerDashboard) {
      return (
        <>
          {contactButton}
          {renderOwnerDashboardButtons(true)}
        </>
      );
    }

    if (isPlatformAuthenticated) {
      return (
        <>
          {contactButton}
          {canShowPlatformDashboardButton
            ? renderPlatformButtons(true)
            : renderOwnerDashboardButtons(true)}
        </>
      );
    }

    return (
      <>
        {contactButton}
        {renderGuestButtons(true)}
      </>
    );
  };

  return (
    <AppBar position="sticky" component="header" className="store-navbar">
      <Toolbar className="store-navbar__toolbar" disableGutters>
        <Box component={NavLink} to={brandHref} className="store-navbar__brand">
          {renderBrandVisual()}

          <Box className="store-navbar__brand-text">
            {brandEyebrow ? (
              <Typography variant="overline" className="store-navbar__eyebrow">
                {brandEyebrow}
              </Typography>
            ) : null}
            <Typography component="span" className="store-navbar__brand-name">
              {resolvedBrandName}
            </Typography>
          </Box>
        </Box>

        {!isMobile && navItems.length ? (
          <Box
            component="nav"
            className="store-navbar__nav"
            aria-label="التنقل الرئيسي"
          >
            <NavLinks items={navItems} resolveTo={buildStorePreviewPath} />
          </Box>
        ) : (
          <Box className="store-navbar__spacer" />
        )}

        <Box className="store-navbar__actions">
          <ThemeToggleButton variant={variant} onSelect={setVariant} />
          {renderCartButton()}
          {!isMobile ? (
            <ContactDeveloperButton
              label="تواصل مع المطور"
              variant="text"
              className="store-navbar__support-button"
            />
          ) : null}

          {!isMobile ? (
            <Stack
              direction="row"
              spacing={1}
              className="store-navbar__auth-wrap"
            >
              {renderDesktopActions()}
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
              <Typography variant="subtitle2">{resolvedBrandName}</Typography>
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

        {navItems.length ? <Box className="store-navbar__drawer-section">
          <Typography variant="overline" className="storefront-eyebrow">
            التنقل
          </Typography>
          <Box className="store-navbar__drawer-links">
            <NavLinks
              items={navItems}
              drawer
              resolveTo={buildStorePreviewPath}
              onNavigate={() => setDrawerOpen(false)}
            />
          </Box>
        </Box> : null}

        <Box className="store-navbar__drawer-section">
          <Typography variant="overline" className="storefront-eyebrow">
            الحساب
          </Typography>
          <Stack spacing={1.25}>{renderDrawerAccountSection()}</Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}
