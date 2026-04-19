import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import LoadingState from "../../components/common/loaders/LoadingState.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import ContactDeveloperButton from "../../components/common/ContactDeveloperButton.jsx";
import CategoryForm from "../../components/dashboard/CategoryForm.jsx";
import CouponForm from "../../components/dashboard/CouponForm.jsx";
import CustomerStoreForm from "../../components/dashboard/CustomerStoreForm.jsx";
import ProductForm from "../../components/dashboard/ProductForm.jsx";
import SectionForm from "../../components/dashboard/SectionForm.jsx";
import StatCard from "../../components/dashboard/StatCard.jsx";
import DashboardSidebar from "../../components/layout/DashboardSidebar.jsx";
import {
  SUBSCRIPTION_PLANS,
  getSubscriptionPlanByKey,
} from "../../constants/subscriptionPlans.js";
import useAuth from "../../hooks/auth/useAuth.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useCreateCategory from "../../hooks/categories/useCreateCategory.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import useUpdateCategory from "../../hooks/categories/useUpdateCategory.js";
import useCreateCoupon from "../../hooks/coupons/useCreateCoupon.js";
import useCoupons from "../../hooks/coupons/useCoupons.js";
import useDeleteCoupon from "../../hooks/coupons/useDeleteCoupon.js";
import useUpdateCoupon from "../../hooks/coupons/useUpdateCoupon.js";
import useDeleteCustomerStore from "../../hooks/customerStores/useDeleteCustomerStore.js";
import useStoreCustomers from "../../hooks/customerStores/useStoreCustomers.js";
import useUpdateCustomerStore from "../../hooks/customerStores/useUpdateCustomerStore.js";
import productApi from "../../API/product.api.js";
import useStoreOrders from "../../hooks/orders/useStoreOrders.js";
import useUpdateOrderStatus from "../../hooks/orders/useUpdateOrderStatus.js";
import useCreateProduct from "../../hooks/products/useCreateProduct.js";
import useDeleteProduct from "../../hooks/products/useDeleteProduct.js";
import useDeleteProductImage from "../../hooks/products/useDeleteProductImage.js";
import useProducts from "../../hooks/products/useProducts.js";
import useUpdateProduct from "../../hooks/products/useUpdateProduct.js";
import useUploadProductImage from "../../hooks/products/useUploadProductImage.js";
import useUpdateReviewApproval from "../../hooks/reviews/useUpdateReviewApproval.js";
import useStoreReviews from "../../hooks/reviews/useStoreReviews.js";
import useCreateSection from "../../hooks/sections/useCreateSection.js";
import useSections from "../../hooks/sections/useSections.js";
import { OWNER_PREVIEW_SEARCH } from "../../hooks/stores/useOwnerStorePreview.js";
import useUpdateSection from "../../hooks/sections/useUpdateSection.js";
import useChangeStoreSubscription from "../../hooks/stores/useChangeStoreSubscription.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import useStoreSubscription from "../../hooks/stores/useStoreSubscription.js";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import {
  logAuthFlow,
  serializeAuthFlowStore,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import extractApiError from "../../utils/extractApiError.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { normalizeOrderDetails } from "../../utils/orders.js";
import {
  getProductComparePrice,
  getProductDisplayPrice,
  getProductOriginalPrice,
  isProductInStock,
  normalizeProductDto,
  normalizeProductList,
} from "../../utils/products.js";
import { isOwnerRole, isSuperAdminRole } from "../../utils/roles.js";
import "./OwnerDashboard.css";

const TAB_CONFIG = [
  {
    key: "overview",
    label: "ظ†ط¸ط±ط© ط¹ط§ظ…ط©",
    route: "/owner",
    description: "ظ…ظ„ط®طµ ط§ظ„ظ…طھط¬ط± ط§ظ„ط³ط±ظٹط¹",
    icon: <StorefrontRoundedIcon fontSize="small" />,
  },
  {
    key: "products",
    label: "ط§ظ„ظ…ظ†طھط¬ط§طھ",
    route: "/owner/products",
    description: "ط¥ط¶ط§ظپط© ظˆطھط¹ط¯ظٹظ„ ظˆظ†ط´ط± ط§ظ„ظ…ظ†طھط¬ط§طھ",
    icon: <Inventory2RoundedIcon fontSize="small" />,
  },
  {
    key: "subscription",
    label: "ط§ط´طھط±ط§ظƒ ط§ظ„ظ…طھط¬ط±",
    route: "/owner/subscription",
    description: "ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط§ظ‚ط© ظˆط­ط¯ظˆط¯ ط§ظ„ط§ط³طھط®ط¯ط§ظ…",
    icon: <WorkspacePremiumRoundedIcon fontSize="small" />,
  },
  {
    key: "categories",
    label: "ط§ظ„طھطµظ†ظٹظپط§طھ",
    route: "/owner/categories",
    description: "ط¨ظ†ط§ط، ط´ط¬ط±ط© ط§ظ„ظƒط§طھظٹط¬ظˆط±ظٹط²",
    icon: <CategoryRoundedIcon fontSize="small" />,
  },
  {
    key: "sections",
    label: "ط§ظ„ط£ظ‚ط³ط§ظ…",
    route: "/owner/sections",
    description: "طھظ†ط¸ظٹظ… ط¹ط±ط¶ ط§ظ„ظ…ظ†طھط¬ط§طھ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©",
    icon: <LayersRoundedIcon fontSize="small" />,
  },
  {
    key: "orders",
    label: "ط§ظ„ط·ظ„ط¨ط§طھ",
    route: "/owner/orders",
    description: "ظ…طھط§ط¨ط¹ط© ط§ظ„ط­ط§ظ„ط© ظˆط§ظ„طھط¬ظ‡ظٹط²",
    icon: <LocalMallRoundedIcon fontSize="small" />,
  },
  {
    key: "coupons",
    label: "ط§ظ„ظƒظˆط¨ظˆظ†ط§طھ",
    route: "/owner/coupons",
    description: "ط¨ظ†ط§ط، ط§ظ„ط¹ط±ظˆط¶ ط§ظ„ط³ط±ظٹط¹ط©",
    icon: <ConfirmationNumberRoundedIcon fontSize="small" />,
  },
  {
    key: "customers",
    label: "ط²ط¨ط§ط¦ظ† ط§ظ„ظ…طھط¬ط±",
    route: "/owner/customers",
    description: "طھط­ط¯ظٹط¯ ظ…ظ† ظٹط´ط§ظ‡ط¯ ط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط© ط¯ط§ط®ظ„ ط§ظ„ظ…طھط¬ط±",
    icon: <PeopleAltRoundedIcon fontSize="small" />,
  },
  {
    key: "reviews",
    label: "ط§ظ„طھظ‚ظٹظٹظ…ط§طھ",
    route: "/owner/reviews",
    description: "ط§ط¹طھظ…ط§ط¯ ط£ظˆ ط±ظپط¶ ط§ظ„ظ…ط±ط§ط¬ط¹ط§طھ",
    icon: <RateReviewRoundedIcon fontSize="small" />,
  },
];

const ORDER_STATUS_OPTIONS = [
  { value: 0, label: "ظ‚ظٹط¯ ط§ظ„ط§ظ†طھط¸ط§ط±" },
  { value: 1, label: "طھظ… ط§ظ„طھط£ظƒظٹط¯" },
  { value: 2, label: "ظ‚ظٹط¯ ط§ظ„طھط¬ظ‡ظٹط²" },
  { value: 3, label: "طھظ… ط§ظ„ط´ط­ظ†" },
  { value: 4, label: "طھظ… ط§ظ„طھط³ظ„ظٹظ…" },
  { value: 5, label: "ظ…ظ„ط؛ظٹ" },
  { value: 6, label: "ظ…ط³طھط±ط¬ط¹" },
];

const MOBILE_SIDEBAR_LAUNCHER_DEFAULT_TOP = 220;
const MOBILE_SIDEBAR_LAUNCHER_MIN_TOP = 92;
const MOBILE_SIDEBAR_LAUNCHER_HEIGHT = 56;
const MOBILE_SIDEBAR_LAUNCHER_BOTTOM_GAP = 92;

function clampMobileSidebarLauncherTop(value) {
  if (typeof window === "undefined") {
    return value;
  }

  const maxTop = Math.max(
    MOBILE_SIDEBAR_LAUNCHER_MIN_TOP,
    window.innerHeight -
      MOBILE_SIDEBAR_LAUNCHER_HEIGHT -
      MOBILE_SIDEBAR_LAUNCHER_BOTTOM_GAP,
  );

  return Math.min(
    Math.max(value, MOBILE_SIDEBAR_LAUNCHER_MIN_TOP),
    maxTop,
  );
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    "طھط¹ط°ط± طھظ†ظپظٹط° ط§ظ„ط¹ظ…ظ„ظٹط©. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰."
  );
}

function getApiErrorMessage(error) {
  return extractApiError(error, "طھط¹ط°ط± طھظ†ظپظٹط° ط§ظ„ط¹ظ…ظ„ظٹط©. ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

function normalizePlanKey(value) {
  const normalized = normalizeText(value);

  if (!normalized) return "";
  if (["free", "basic", "starter", "trial", "0"].includes(normalized))
    return "free";
  if (["standard", "pro-1", "business", "growth", "1"].includes(normalized))
    return "standard";
  if (["pro", "premium", "enterprise", "plus", "ultimate", "2", "3"].includes(normalized))
    return "pro";

  return "";
}

function resolveNestedValue(item, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], item);
}

function slugify(value) {
  return normalizeText(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

function matchesText(item, keyword, fields) {
  if (!keyword) return true;
  const normalized = normalizeText(keyword);

  return fields.some((field) =>
    normalizeText(
      field.includes(".") ? resolveNestedValue(item, field) : item?.[field],
    ).includes(normalized),
  );
}

function buildProductForm(defaultCategoryId = "", defaultSectionId = "") {
  return {
    mode: "create",
    id: "",
    name: "",
    slug: "",
    slugManuallyEdited: false,
    sku: "",
    shortDescription: "",
    description: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    stockQuantity: "",
    categoryId: defaultCategoryId,
    sectionId: defaultSectionId,
    trackInventory: true,
    isFeatured: false,
    status: "1",
    publishNow: true,
    metaTitle: "",
    metaDescription: "",
    newImages: [],
    existingImages: [],
    variants: [],
    attributeValues: [],
  };
}

function buildCategoryForm() {
  return {
    mode: "create",
    id: "",
    name: "",
    slug: "",
    slugManuallyEdited: false,
    description: "",
    displayOrder: "1",
    parentCategoryId: "",
    isActive: true,
  };
}

function buildSectionForm() {
  return {
    mode: "create",
    id: "",
    name: "",
    slug: "",
    slugManuallyEdited: false,
    description: "",
    displayOrder: "0",
    isActive: true,
  };
}

function buildCouponForm() {
  return {
    mode: "create",
    id: "",
    code: "",
    discountType: "0",
    discountValue: "",
    isActive: true,
  };
}

function buildCustomerStoreForm() {
  return {
    mode: "edit",
    id: "",
    fullName: "",
    email: "",
    phone: "",
    discountPercentage: "0",
    isActive: true,
  };
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function normalizeStoreSubscription(data, store) {
  const normalizedData = normalizeEntityResponse(data) || data || {};
  const fromNested =
    (normalizedData.subscription &&
    typeof normalizedData.subscription === "object"
      ? normalizedData.subscription
      : null) ||
    (normalizedData.currentSubscription &&
    typeof normalizedData.currentSubscription === "object"
      ? normalizedData.currentSubscription
      : null) ||
    (normalizedData.subscriptionPlan &&
    typeof normalizedData.subscriptionPlan === "object"
      ? normalizedData.subscriptionPlan
      : null) ||
    (normalizedData.plan && typeof normalizedData.plan === "object"
      ? normalizedData.plan
      : null) ||
    {};

  const currentPlan =
    normalizePlanKey(
      firstDefined(
        fromNested.plan,
        fromNested.planName,
        fromNested.planKey,
        fromNested.key,
        fromNested.name,
        fromNested.subscriptionPlan,
        fromNested.tier,
        fromNested.planId,
        fromNested.subscriptionPlanId,
        fromNested.id,
        normalizedData.plan,
        normalizedData.planName,
        normalizedData.planKey,
        normalizedData.key,
        normalizedData.subscriptionPlan,
        normalizedData.planId,
        normalizedData.subscriptionPlanId,
        normalizedData.tier,
        store?.plan,
        store?.planName,
        store?.planKey,
        store?.subscriptionPlan,
        store?.planId,
        store?.subscriptionPlanId,
      ),
    ) || "free";

  return {
    currentPlan,
    startedAt: firstDefined(
      fromNested.startedAt,
      fromNested.startDate,
      normalizedData.startedAt,
      normalizedData.subscriptionStartDate,
    ),
    renewalAt: firstDefined(
      fromNested.renewalAt,
      fromNested.renewalDate,
      fromNested.expiresAt,
      normalizedData.renewalAt,
      normalizedData.expiresAt,
      normalizedData.subscriptionRenewalDate,
    ),
  };
}

function buildSubscriptionPayload(planKey) {
  return {
    plan: planKey,
    planKey,
    planName: planKey,
    subscriptionPlan: planKey,
    tier: planKey,
  };
}

function toNumber(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return Boolean(value);
}

function formatDiscountPercentage(value) {
  return `${toNumber(value, 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

function _normalizeCustomerOption(entity) {
  const source = entity?.customer || entity?.user || entity;
  const id = firstDefined(
    entity?.customerId,
    entity?.userId,
    source?.id,
    source?.userId,
    source?.customerId,
  );

  return {
    id: id ? String(id) : "",
    name: firstDefined(
      entity?.customerName,
      entity?.name,
      source?.fullName,
      source?.name,
      source?.userName,
    ),
    email: firstDefined(entity?.customerEmail, entity?.email, source?.email),
    raw: entity,
  };
}

function normalizeStoreCustomer(item) {
  const customer = item;
  const id = firstDefined(item?.id, item?.customerStoreId, customer.id);

  return {
    id: id ? String(id) : "",
    storeId: item?.storeId ? String(item.storeId) : "",
    firstName: firstDefined(item?.firstName, ""),
    lastName: firstDefined(item?.lastName, ""),
    fullName: firstDefined(
      item?.fullName,
      `${item?.firstName || ""} ${item?.lastName || ""}`.trim(),
      "ط¹ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±",
    ),
    name: customer.name || "ظ…ط³طھط®ط¯ظ…",
    email: customer.email || "-",
    phone: firstDefined(item?.phone, "-"),
    discountPercentage: toNumber(
      firstDefined(
        item?.discountPercentage,
        item?.discount,
        item?.discountValue,
        0,
      ),
      0,
    ),
    isActive: toBoolean(item?.isActive, true),
    createdAt: item?.createdAt || "",
    updatedAt: item?.updatedAt || "",
    raw: item,
  };
}

function _dedupeCustomers(customers) {
  const seen = new Set();

  return customers.filter((customer) => {
    const key = normalizeText(customer?.id);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getOrderStatusLabel(value) {
  return (
    ORDER_STATUS_OPTIONS.find((option) => option.value === Number(value))
      ?.label || "ط؛ظٹط± ظ…ط­ط¯ط¯ط©"
  );
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

function normalizeOrderSummary(item) {
  const normalizedOrder = normalizeOrderDetails(item);

  return {
    ...normalizedOrder,
    orderNumber: firstDefined(
      normalizedOrder?.orderNumber,
      normalizedOrder?.id,
      "-",
    ),
    statusLabel: getOrderStatusLabel(normalizedOrder?.status),
    createdAtLabel: formatDateTimeLabel(normalizedOrder?.createdAt),
    totalAmount: toNumber(normalizedOrder?.totalAmount, 0),
    itemsCount: toNumber(normalizedOrder?.itemsCount, 0),
  };
}

function normalizeReviewItem(item) {
  return {
    ...item,
    storeCustomerFullName: firstDefined(
      item?.storeCustomerFullName,
      "ط¹ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±",
    ),
    productId: item?.productId ? String(item.productId) : "-",
    createdAtLabel: formatDateTimeLabel(item?.createdAt),
  };
}

function flattenCategories(categories) {
  const byParent = new Map();

  [...categories]
    .sort((a, b) => {
      const orderDiff =
        Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ar");
    })
    .forEach((category) => {
      const parentId = category.parentCategoryId || "root";
      const group = byParent.get(parentId) ?? [];
      group.push(category);
      byParent.set(parentId, group);
    });

  const result = [];

  function walk(parentId = "root", depth = 0, ancestors = []) {
    const items = byParent.get(parentId) ?? [];

    items.forEach((item) => {
      const path = [...ancestors, item.name].filter(Boolean);
      const children = byParent.get(item.id) ?? [];

      result.push({
        ...item,
        depth,
        path,
        pathLabel: path.join(" / "),
        label: `${"â€” ".repeat(depth)}${item.name}${item.isActive ? "" : " (ط؛ظٹط± ظ†ط´ط·)"}`,
        isLeaf: children.length === 0,
      });

      walk(item.id, depth + 1, path);
    });
  }

  walk();
  return result;
}

function formatProductStatus(value) {
  switch (Number(value)) {
    case 0:
      return "ظ…ط³ظˆط¯ط©";
    case 1:
      return "ظ†ط´ط·";
    case 2:
      return "ظ…ط¤ط±ط´ظپ";
    case 3:
      return "ظ†ظپط¯ ظ…ط®ط²ظˆظ†ظ‡";
    default:
      return "ط؛ظٹط± ظ…ط­ط¯ط¯";
  }
}

function SectionHeader({ title, description, onRefresh, isRefreshing }) {
  return (
    <Box className="owner-panel__head">
      <Box>
        <Typography variant="h5" className="owner-panel__title">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <AppButton variant="outlined" onClick={onRefresh} loading={isRefreshing}>
        طھط­ط¯ظٹط«
      </AppButton>
    </Box>
  );
}

function OrderDetailsDialog({ open, order, loading, error, onClose }) {
  const displayStatus =
    order?.statusText || order?.statusLabel || getOrderStatusLabel(order?.status);
  const createdAtLabel = order?.createdAtLabel || formatDateTimeLabel(order?.createdAt);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>طھظپط§طµظٹظ„ ط§ظ„ط·ظ„ط¨</DialogTitle>

      <DialogContent dividers>
        {loading && !order ? <LoadingState label="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ طھظپط§طµظٹظ„ ط§ظ„ط·ظ„ط¨..." /> : null}

        {!loading && error && !order ? (
          <Alert severity="error">{getApiErrorMessage(error)}</Alert>
        ) : null}

        {order ? (
          <Box className="owner-order-dialog">
            {error ? (
              <Alert severity="warning">
                طھط¹ط°ط± طھط­ظ…ظٹظ„ ط£ط­ط¯ط« ظ†ط³ط®ط© ظ…ظ† ط§ظ„ط·ظ„ط¨طŒ ظ„ط°ظ„ظƒ ظٹطھظ… ط¹ط±ط¶ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھظˆظپط±ط© ط­ط§ظ„ظٹظ‹ط§.
              </Alert>
            ) : null}

            <Box className="owner-order-dialog__grid">
              <Box className="owner-order-dialog__meta">
                <span>ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨</span>
                <strong>{order.orderNumber || order.id || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>ط§ظ„ط¹ظ…ظٹظ„</span>
                <strong>
                  {order.customerName || "Customer not found"} ({order.customerId || order.storeCustomerId || "-"})
                </strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،</span>
                <strong>{createdAtLabel}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>ط§ظ„ط­ط§ظ„ط©</span>
                <strong>{displayStatus || "ط؛ظٹط± ظ…ط­ط¯ط¯ط©"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>ط§ظ„ط¹ظ†ظˆط§ظ†</span>
                <strong>{order.deliveryAddress || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>ط§ظ„ظ…ط¯ظٹظ†ط©</span>
                <strong>{order.deliveryCity || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>ط§ظ„ظ‡ط§طھظپ</span>
                <strong>{order.deliveryPhone || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>ط§ظ„ظƒظˆط¨ظˆظ†</span>
                <strong>{order.couponCode || "-"}</strong>
              </Box>
            </Box>

            {order.customerNotes ? (
              <Box className="owner-order-dialog__note">
                <Typography variant="subtitle2">ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ط¹ظ…ظٹظ„</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.customerNotes}
                </Typography>
              </Box>
            ) : null}

            <Box className="owner-order-dialog__items">
              <Box className="owner-order-dialog__items-head">
                <Typography variant="h6">ظ…ط­طھظˆظٹط§طھ ط§ظ„ط·ظ„ط¨</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.itemsCount ?? 0} ظ‚ط·ط¹ط©
                </Typography>
              </Box>

              {order.items?.length ? (
                <Stack spacing={1.5}>
                  {order.items.map((item, index) => (
                    <Box
                      key={item.id || item.productId || `order-item-${index}`}
                      className="owner-order-item"
                    >
                      <Box className="owner-order-item__head">
                        <Box>
                          <Typography variant="subtitle2">
                            {item.productName || `ظ…ظ†طھط¬ ${index + 1}`}
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
                        <span>ط§ظ„ظƒظ…ظٹط©: {item.quantity}</span>
                        <span>ط³ط¹ط± ط§ظ„ظˆط­ط¯ط©: {formatCurrency(item.unitPrice)}</span>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">
                  ظ„ط§ طھظˆط¬ط¯ طھظپط§طµظٹظ„ ظ…ظ†طھط¬ط§طھ ظ…ط±ظپظ‚ط© ط¨ظ‡ط°ط§ ط§ظ„ط·ظ„ط¨ ظ…ظ† ط§ظ„ظ€ API ط§ظ„ط­ط§ظ„ظٹ.
                </Alert>
              )}
            </Box>

            <Box className="owner-order-dialog__summary">
              <Box className="owner-order-dialog__summary-row">
                <span>ط§ظ„ط³ط¹ط± ط§ظ„ط£طµظ„ظٹ</span>
                <strong>{formatCurrency(order.subtotal)}</strong>
              </Box>
              <Box className="owner-order-dialog__summary-row">
                <span>ط§ظ„ط®طµظ…</span>
                <strong>{formatCurrency(order.discount)}</strong>
              </Box>
              <Box className="owner-order-dialog__summary-row owner-order-dialog__summary-row--total">
                <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ†ظ‡ط§ط¦ظٹ</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <AppButton variant="outlined" onClick={onClose}>
          ط¥ط؛ظ„ط§ظ‚
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

export default function OwnerDashboard({ initialTab = "overview" }) {
  const navigate = useNavigate();
  const isCompactScreen = useMediaQuery("(max-width:1080px)");
  const mobileSidebarDragRef = useRef({
    pointerId: null,
    startY: 0,
    startTop: MOBILE_SIDEBAR_LAUNCHER_DEFAULT_TOP,
    moved: false,
  });
  const mobileSidebarIgnoreClickRef = useRef(false);
  const { isAuthenticated, role, user } = useAuth();
  const activeTab = TAB_CONFIG.some((tab) => tab.key === initialTab)
    ? initialTab
    : "overview";
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSidebarDragging, setIsMobileSidebarDragging] = useState(false);
  const [mobileSidebarLauncherTop, setMobileSidebarLauncherTop] = useState(
    MOBILE_SIDEBAR_LAUNCHER_DEFAULT_TOP,
  );
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const ownerStoreQuery = useOwnerStore({ refetchOnWindowFocus: false });
  const store = ownerStoreQuery.ownerStore;
  const storeId = store?.id;

  useEffect(() => {
    logAuthFlow("Owner dashboard state", {
      isAuthenticated,
      role,
      user: serializeAuthFlowUser(user),
      ownerStoreSource: ownerStoreQuery.ownerStoreSource,
      store: serializeAuthFlowStore(store),
      storeId: String(storeId || ""),
      isOwnerStoreLoading: ownerStoreQuery.isLoading,
      hasOwnerStoreError: Boolean(ownerStoreQuery.error),
    });
  }, [
    isAuthenticated,
    ownerStoreQuery.error,
    ownerStoreQuery.isLoading,
    ownerStoreQuery.ownerStoreSource,
    role,
    store,
    storeId,
    user,
  ]);

  // Apply store branding (theme, colors, etc.)
  useStoreBranding(store);

  const isOverviewTab = activeTab === "overview";
  const shouldLoadProducts = isOverviewTab || activeTab === "products";
  const shouldLoadCategories =
    isOverviewTab || activeTab === "categories" || activeTab === "products";
  const shouldLoadSections =
    isOverviewTab || activeTab === "sections" || activeTab === "products";
  const shouldLoadCoupons = isOverviewTab || activeTab === "coupons";
  const shouldLoadCustomerStores =
    isOverviewTab || activeTab === "customers" || activeTab === "orders";
  const shouldLoadOrders = isOverviewTab || activeTab === "orders";
  const shouldLoadReviews = isOverviewTab || activeTab === "reviews";
  const shouldLoadSubscription = isOverviewTab || activeTab === "subscription";

  const productsQuery = useProducts(storeId, undefined, {
    enabled: Boolean(storeId) && shouldLoadProducts,
    staleTime: 30000,
  });
  const categoriesQuery = useCategories(storeId, {
    enabled: Boolean(storeId) && shouldLoadCategories,
    staleTime: 30000,
  });
  const sectionsQuery = useSections(storeId, {
    enabled: Boolean(storeId) && shouldLoadSections,
    staleTime: 30000,
  });
  const couponsQuery = useCoupons(storeId, {
    enabled: Boolean(storeId) && shouldLoadCoupons,
    staleTime: 30000,
  });
  const storeCustomersQuery = useStoreCustomers(storeId, {
    enabled: Boolean(storeId) && shouldLoadCustomerStores,
    staleTime: 30000,
  });
  const ordersQuery = useStoreOrders(storeId, {
    enabled: Boolean(storeId) && shouldLoadOrders,
    staleTime: 30000,
  });
  const reviewsQuery = useStoreReviews(storeId, {
    enabled: Boolean(storeId) && shouldLoadReviews,
    staleTime: 30000,
  });
  const subscriptionQuery = useStoreSubscription(storeId, {
    enabled: Boolean(storeId) && shouldLoadSubscription,
    staleTime: 30000,
  });

  const createProductMutation = useCreateProduct(storeId);
  const updateProductMutation = useUpdateProduct(storeId);
  const deleteProductMutation = useDeleteProduct(storeId);
  const uploadProductImageMutation = useUploadProductImage(storeId);
  const deleteProductImageMutation = useDeleteProductImage(storeId);

  const createCategoryMutation = useCreateCategory(storeId);
  const updateCategoryMutation = useUpdateCategory(storeId);

  const createSectionMutation = useCreateSection(storeId);
  const updateSectionMutation = useUpdateSection(storeId);

  const createCouponMutation = useCreateCoupon(storeId);
  const updateCouponMutation = useUpdateCoupon(storeId);
  const deleteCouponMutation = useDeleteCoupon(storeId);
  const updateCustomerStoreMutation = useUpdateCustomerStore(storeId);
  const deleteCustomerStoreMutation = useDeleteCustomerStore(storeId);

  const updateOrderStatusMutation = useUpdateOrderStatus(storeId);
  const updateReviewApprovalMutation = useUpdateReviewApproval(storeId);
  const [subscriptionSuccessMessage, setSubscriptionSuccessMessage] =
    useState("");
  const changeSubscriptionMutation = useChangeStoreSubscription(storeId, {
    onSuccess: () => {
      setSubscriptionSuccessMessage("طھظ… طھط­ط¯ظٹط« ط¨ط§ظ‚ط© ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­.");
    },
  });

  const productsRaw = normalizeProductList(productsQuery.data);
  const categoriesRaw = normalizeListResponse(categoriesQuery.data);
  const sectionsRaw = normalizeListResponse(sectionsQuery.data);
  const couponsRaw = normalizeListResponse(couponsQuery.data);
  const storeCustomersRaw = normalizeListResponse(storeCustomersQuery.data);
  const ordersRaw = normalizeListResponse(ordersQuery.data);
  const reviewsRaw = normalizeListResponse(reviewsQuery.data);

  const categoryOptions = useMemo(
    () => flattenCategories(categoriesRaw),
    [categoriesRaw],
  );
  const defaultCategoryId =
    categoryOptions.find((item) => item.isActive && item.isLeaf)?.id ||
    categoryOptions.find((item) => item.isActive)?.id ||
    categoryOptions[0]?.id ||
    "";
  const defaultSectionId =
    sectionsRaw.find((item) => item.isActive)?.id || sectionsRaw[0]?.id || "";

  const [productForm, setProductForm] = useState(() =>
    buildProductForm(defaultCategoryId, defaultSectionId),
  );
  const [categoryForm, setCategoryForm] = useState(() => buildCategoryForm());
  const [sectionForm, setSectionForm] = useState(() => buildSectionForm());
  const [couponForm, setCouponForm] = useState(() => buildCouponForm());
  const [customerStoreForm, setCustomerStoreForm] = useState(() =>
    buildCustomerStoreForm(),
  );
  const [editingProductId, setEditingProductId] = useState("");
  const [productFormError, setProductFormError] = useState("");

  const newImagePreviews = useMemo(
    () =>
      productForm.newImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [productForm.newImages],
  );

  useEffect(
    () => () => {
      newImagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    },
    [newImagePreviews],
  );

  useEffect(() => {
    setProductForm((previous) => {
      if (previous.mode !== "create") {
        return previous;
      }

      const nextCategoryId = previous.categoryId || defaultCategoryId;
      const nextSectionId = previous.sectionId || defaultSectionId;

      if (
        previous.categoryId === nextCategoryId &&
        previous.sectionId === nextSectionId
      ) {
        return previous;
      }

      return {
        ...previous,
        categoryId: nextCategoryId,
        sectionId: nextSectionId,
      };
    });
  }, [defaultCategoryId, defaultSectionId]);

  const categoryLookup = useMemo(
    () => new Map(categoryOptions.map((item) => [item.id, item])),
    [categoryOptions],
  );
  const sectionLookup = useMemo(
    () => new Map(sectionsRaw.map((item) => [item.id, item])),
    [sectionsRaw],
  );
  const products = useMemo(
    () =>
      productsRaw.filter((item) =>
        matchesText(item, deferredSearchText, [
          "name",
          "fullName",
          "slug",
          "sku",
          "shortDescription",
          "description",
          "categoryName",
          "sectionName",
          "metaTitle",
          "metaDescription",
        ]),
      ),
    [deferredSearchText, productsRaw],
  );
  const categories = useMemo(
    () =>
      categoryOptions.filter((item) =>
        matchesText(item, deferredSearchText, [
          "name",
          "pathLabel",
          "description",
        ]),
      ),
    [categoryOptions, deferredSearchText],
  );
  const sections = useMemo(
    () =>
      sectionsRaw.filter((item) =>
        matchesText(item, deferredSearchText, ["name", "slug", "description"]),
      ),
    [deferredSearchText, sectionsRaw],
  );
  const coupons = useMemo(
    () =>
      couponsRaw.filter((item) =>
        matchesText(item, deferredSearchText, ["code", "description"]),
      ),
    [couponsRaw, deferredSearchText],
  );
  const storeCustomersAll = useMemo(
    () =>
      storeCustomersRaw
        .map((item) => normalizeStoreCustomer(item))
        .filter((item) => item.id),
    [storeCustomersRaw],
  );
  const customersById = useMemo(
    () =>
      new Map(
        storeCustomersAll.map((customer) => [String(customer.id), customer]),
      ),
    [storeCustomersAll],
  );
  const customers = useMemo(
    () =>
      storeCustomersAll.filter((item) =>
        matchesText(item, deferredSearchText, ["fullName", "email", "phone"]),
      ),
    [deferredSearchText, storeCustomersAll],
  );
  const ordersAll = useMemo(
    () =>
      ordersRaw.map((item) => {
        const normalizedOrder = normalizeOrderSummary(item);
        const customer =
          customersById.get(String(normalizedOrder.storeCustomerId || "")) || null;
        const customerName =
          customer?.fullName ||
          normalizedOrder.customerName ||
          normalizedOrder.customerEmail ||
          "ط¹ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±";
        const customerEmail =
          customer?.email || normalizedOrder.customerEmail || "";
        const customerPhone =
          customer?.phone === "-"
            ? normalizedOrder.customerPhone || ""
            : customer?.phone || normalizedOrder.customerPhone || "";

        return {
          ...normalizedOrder,
          customer,
          customerName,
          customerEmail,
          customerPhone,
          customerId: customer?.id || normalizedOrder.storeCustomerId || "",
        };
      }),
    [customersById, ordersRaw],
  );
  const orders = useMemo(
    () =>
      ordersAll.filter((item) =>
        matchesText(item, deferredSearchText, [
          "orderNumber",
          "customerName",
          "customerEmail",
          "customerPhone",
          "storeCustomerId",
          "deliveryPhone",
          "couponCode",
          "statusLabel",
          "createdAtLabel",
        ]),
      ),
    [deferredSearchText, ordersAll],
  );
  const storeOrderColumns = [
    {
      key: "orderNumber",
      title: "ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨",
      render: (row) => row.orderNumber || row.id || "-",
    },
    {
      key: "customerName",
      title: "ط§ظ„ط¹ظ…ظٹظ„",
      render: (row) => row.customerName || "ط؛ظٹط± ظ…ط­ط¯ط¯",
    },
    {
      key: "customerId",
      title: "Customer ID",
      render: (row) => row.customerId || row.storeCustomerId || "-",
    },
    {
      key: "itemsCount",
      title: "ط§ظ„ظ…ط­طھظˆظ‰",
      render: (row) => `${row.itemsCount ?? 0} ظ‚ط·ط¹ط©`,
    },
    {
      key: "createdAtLabel",
      title: "طھط§ط±ظٹط® ط§ظ„ط·ظ„ط¨",
      render: (row) => row.createdAtLabel || "-",
    },
    {
      key: "totalAmount",
      title: "ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ",
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: "status",
      title: "ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©",
      render: (row) => row.statusText || row.statusLabel || "ط؛ظٹط± ظ…ط­ط¯ط¯ط©",
    },
    {
      key: "details",
      title: "ط§ظ„طھظپط§طµظٹظ„",
      render: (row) => (
        <AppButton
          size="small"
          variant="outlined"
            component={RouterLink}
            to={`/owner/orders/${row.id}`}
        >
          ط¹ط±ط¶ ط§ظ„طھظپط§طµظٹظ„
        </AppButton>
      ),
    },
    {
      key: "actions",
      title: "طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط©",
      render: (row) => (
        <TextField
          select
          size="small"
          value={String(row.status ?? 0)}
          onChange={(event) =>
            updateOrderStatusMutation.mutate({
              orderId: row.id,
              payload: { status: Number(event.target.value) },
            })
          }
          sx={{ minWidth: 180 }}
        >
          {ORDER_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={String(option.value)}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
  ];
  const reviewsAll = useMemo(
    () => reviewsRaw.map((item) => normalizeReviewItem(item)),
    [reviewsRaw],
  );
  const reviews = useMemo(
    () =>
      reviewsAll.filter((item) =>
        matchesText(item, deferredSearchText, [
          "storeCustomerFullName",
          "comment",
          "productId",
        ]),
      ),
    [deferredSearchText, reviewsAll],
  );

  const pendingReviewsCount = reviewsAll.filter(
    (item) => !item.isApproved,
  ).length;
  const pendingOrdersCount = ordersAll.filter(
    (item) => Number(item.status) === 0,
  ).length;
  const subscription = useMemo(
    () => normalizeStoreSubscription(subscriptionQuery.data, store),
    [subscriptionQuery.data, store],
  );
  const activePlan = useMemo(
    () => getSubscriptionPlanByKey(subscription.currentPlan),
    [subscription.currentPlan],
  );
  const [selectedPlanKey, setSelectedPlanKey] = useState("");

  useEffect(() => {
    if (!subscription.currentPlan) return;
    setSelectedPlanKey(subscription.currentPlan);
  }, [subscription.currentPlan]);

  const overviewStats = [
    {
      label: "ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…ظ†ط´ظˆط±ط©",
      value: productsRaw.length,
      help: "ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„ط¸ط§ظ‡ط±ط© ط­ط§ظ„ظٹظ‹ط§ ظپظٹ ط§ظ„ظ…طھط¬ط±",
      icon: <SellRoundedIcon fontSize="small" />,
      tone: "warm",
    },
    {
      label: "ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ظ…ظپطھظˆط­ط©",
      value: pendingOrdersCount,
      help: "ط·ظ„ط¨ط§طھ طھط­طھط§ط¬ ظ…طھط§ط¨ط¹ط© ط£ظˆ طھط£ظƒظٹط¯",
      icon: <LocalMallRoundedIcon fontSize="small" />,
      tone: "cool",
    },
    {
      label: "ط§ظ„طھطµظ†ظٹظپط§طھ",
      value: categoriesRaw.length,
      help: "ط´ط¬ط±ط© ط§ظ„ظƒط§طھظٹط¬ظˆط±ظٹط² ط§ظ„ط­ط§ظ„ظٹط©",
      icon: <CategoryRoundedIcon fontSize="small" />,
      tone: "neutral",
    },
    {
      label: "ط§ظ„ظ…ط±ط§ط¬ط¹ط§طھ ط§ظ„ظ…ط¹ظ„ظ‚ط©",
      value: pendingReviewsCount,
      help: "طھظ‚ظٹظٹظ…ط§طھ ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯",
      icon: <RateReviewRoundedIcon fontSize="small" />,
      tone: "cool",
    },
  ];

  const sidebarItems = TAB_CONFIG.map((item) => {
    let count;

    switch (item.key) {
      case "products":
        count = productsQuery.isSuccess ? productsRaw.length : undefined;
        break;
      case "categories":
        count = categoriesQuery.isSuccess ? categoriesRaw.length : undefined;
        break;
      case "sections":
        count = sectionsQuery.isSuccess ? sectionsRaw.length : undefined;
        break;
      case "orders":
        count = ordersQuery.isSuccess ? ordersRaw.length : undefined;
        break;
      case "coupons":
        count = couponsQuery.isSuccess ? couponsRaw.length : undefined;
        break;
      case "customers":
        count = storeCustomersQuery.isSuccess
          ? storeCustomersAll.length
          : undefined;
        break;
      case "reviews":
        count = reviewsQuery.isSuccess ? pendingReviewsCount : undefined;
        break;
      default:
        count = undefined;
    }

    return {
      ...item,
      count,
    };
  });

  const allErrors = [
    createProductMutation.error,
    updateProductMutation.error,
    deleteProductMutation.error,
    uploadProductImageMutation.error,
    deleteProductImageMutation.error,
    createCategoryMutation.error,
    updateCategoryMutation.error,
    createSectionMutation.error,
    updateSectionMutation.error,
    createCouponMutation.error,
    updateCouponMutation.error,
    deleteCouponMutation.error,
    updateCustomerStoreMutation.error,
    deleteCustomerStoreMutation.error,
    updateOrderStatusMutation.error,
    updateReviewApprovalMutation.error,
    changeSubscriptionMutation.error,
  ];
  const mutationError = allErrors.find(Boolean);

  const resetProductForm = () => {
    setProductFormError("");
    setProductForm(buildProductForm(defaultCategoryId, defaultSectionId));
  };
  const resetCategoryForm = () => setCategoryForm(buildCategoryForm());
  const resetSectionForm = () => setSectionForm(buildSectionForm());
  const resetCouponForm = () => setCouponForm(buildCouponForm());
  const resetCustomerStoreForm = () =>
    setCustomerStoreForm(buildCustomerStoreForm());

  const buildEditProductForm = (product) => ({
    mode: "edit",
    id: product?.id || "",
    name: product?.name || "",
    slug: product?.slug || "",
    slugManuallyEdited: true,
    sku: product?.sku || "",
    shortDescription: product?.shortDescription || "",
    description: product?.description || "",
    price:
      product?.originalPrice !== undefined ||
      product?.OriginalPrice !== undefined ||
      product?.price !== undefined ||
      product?.Price !== undefined
        ? String(getProductOriginalPrice(product))
        : "",
    compareAtPrice: getProductComparePrice(product)
      ? String(getProductComparePrice(product))
      : "",
    costPrice:
      product?.costPrice !== undefined && product?.costPrice !== null
        ? String(product.costPrice)
        : "",
    stockQuantity: String(product?.stockQuantity ?? 0),
    categoryId: product?.categoryId || defaultCategoryId,
    sectionId: product?.sectionId || defaultSectionId,
    trackInventory: Boolean(product?.trackInventory),
    isFeatured: Boolean(product?.isFeatured),
    status: String(product?.status ?? 1),
    publishNow: true,
    metaTitle: product?.metaTitle || "",
    metaDescription: product?.metaDescription || "",
    newImages: [],
    existingImages: Array.isArray(product?.images) ? product.images : [],
    variants: Array.isArray(product?.variants) ? product.variants : [],
    attributeValues: Array.isArray(product?.attributeValues)
      ? product.attributeValues
      : [],
  });

  const handleOpenProductEditor = async (row) => {
    if (!row?.id || editingProductId) return;

    setEditingProductId(row.id);
    setProductFormError("");

    try {
      const product = normalizeProductDto(
        await productApi.getProductById(row.id),
      );

      setProductForm(buildEditProductForm(product || row));
    } catch {
      setProductForm(buildEditProductForm(row));
    } finally {
      setEditingProductId("");
    }
  };

  useEffect(() => {
    if (!isCompactScreen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isCompactScreen]);

  useEffect(() => {
    if (!isCompactScreen || typeof window === "undefined") {
      return undefined;
    }

    const syncLauncherPosition = () => {
      setMobileSidebarLauncherTop((previous) =>
        clampMobileSidebarLauncherTop(previous),
      );
    };

    syncLauncherPosition();
    window.addEventListener("resize", syncLauncherPosition);

    return () => {
      window.removeEventListener("resize", syncLauncherPosition);
    };
  }, [isCompactScreen]);

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isOwnerRole(role)) {
    return <Navigate to={isSuperAdminRole(role) ? "/dashboard" : "/"} replace />;
  }

  if (ownerStoreQuery.isLoading) {
    return <LoadingState label="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط¬ط±..." />;
  }

  if (!store) {
    return (
      <EmptyState
        title="ظ„ط§ ظٹظˆط¬ط¯ ظ…طھط¬ط± ظ…ط±طھط¨ط· ط¨ظ‡ط°ط§ ط§ظ„ط­ط³ط§ط¨"
        description="طھط£ظƒط¯ ظ…ظ† ظˆط¬ظˆط¯ ظ…طھط¬ط± ظ…ط±طھط¨ط· ط¨طµط§ط­ط¨ ط§ظ„ط­ط³ط§ط¨ ط£ظˆ طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ط¥ط¯ط§ط±ط©."
        action={
          <AppButton component={RouterLink} to="/" variant="contained">
            Home
          </AppButton>
        }
      />
    );
  }

  const selectedCategory = categoryLookup.get(productForm.categoryId);
  const categoryHint = selectedCategory?.isLeaf
    ? `ط§ظ„ظ…ظ†طھط¬ ط³ظٹط±طھط¨ط· ط¨ط§ظ„طھطµظ†ظٹظپ: ${selectedCategory.pathLabel}`
    : selectedCategory
      ? `ظٹظپط¶ظ„ ط±ط¨ط· ط§ظ„ظ…ظ†طھط¬ ط¨ط¢ط®ط± ظ…ط³طھظˆظ‰ ط¯ط§ط®ظ„: ${selectedCategory.pathLabel}`
      : "";

  const confirmDelete = (label, mutation, variables) => {
    if (!window.confirm(`ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ${label}طں`)) return;
    mutation.mutate(variables);
  };

  const handleTabNavigate = (key) => {
    const nextTab = TAB_CONFIG.find((item) => item.key === key);
    if (!nextTab) return;
    navigate(nextTab.route);
  };

  const handleSidebarNavigate = (key) => {
    if (isCompactScreen) {
      setIsMobileSidebarOpen(false);
    }

    handleTabNavigate(key);
  };

  const finishMobileSidebarDrag = (event) => {
    const dragState = mobileSidebarDragRef.current;
    const hasDragged = dragState.moved;

    if (dragState.pointerId !== null) {
      event?.currentTarget?.releasePointerCapture?.(dragState.pointerId);
    }

    mobileSidebarDragRef.current = {
      pointerId: null,
      startY: 0,
      startTop: mobileSidebarLauncherTop,
      moved: false,
    };

    if (hasDragged) {
      mobileSidebarIgnoreClickRef.current = true;
      window.setTimeout(() => {
        mobileSidebarIgnoreClickRef.current = false;
      }, 0);
    }

    setIsMobileSidebarDragging(false);
  };

  const handleMobileSidebarPointerDown = (event) => {
    if (!isCompactScreen) {
      return;
    }

    mobileSidebarDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: mobileSidebarLauncherTop,
      moved: false,
    };

    setIsMobileSidebarDragging(false);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleMobileSidebarPointerMove = (event) => {
    const dragState = mobileSidebarDragRef.current;

    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - dragState.startY;

    if (!dragState.moved && Math.abs(deltaY) > 6) {
      dragState.moved = true;
      setIsMobileSidebarDragging(true);
    }

    if (!dragState.moved) {
      return;
    }

    setMobileSidebarLauncherTop(
      clampMobileSidebarLauncherTop(dragState.startTop + deltaY),
    );
  };

  const handleMobileSidebarPointerUp = (event) => {
    finishMobileSidebarDrag(event);
  };

  const handleMobileSidebarPointerCancel = (event) => {
    finishMobileSidebarDrag(event);
  };

  const handleMobileSidebarLauncherClick = () => {
    if (mobileSidebarIgnoreClickRef.current) {
      return;
    }

    setIsMobileSidebarOpen(true);
  };

  const handleProductFormChange = (key, value) => {
    setProductForm((previous) => {
      if (key === "slug") {
        return {
          ...previous,
          slug: slugify(value),
          slugManuallyEdited: true,
        };
      }

      if (key === "name") {
        const nextState = { ...previous, name: value };
        const previousAutoSlug = slugify(previous.name);

        if (
          previous.mode === "create" &&
          (!previous.slugManuallyEdited ||
            !previous.slug ||
            previous.slug === previousAutoSlug)
        ) {
          nextState.slug = slugify(value);
          nextState.slugManuallyEdited = false;
        }

        return nextState;
      }

      return { ...previous, [key]: value };
    });
  };

  const handleChangeSubscription = async (planKey) => {
    if (!planKey || planKey === subscription.currentPlan) {
      return;
    }

    setSubscriptionSuccessMessage("");

    try {
      await changeSubscriptionMutation.mutateAsync({
        planKey,
        payload: buildSubscriptionPayload(planKey),
      });
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleCategoryFormChange = (key, value) => {
    setCategoryForm((previous) => {
      if (key === "slug") {
        return {
          ...previous,
          slug: slugify(value),
          slugManuallyEdited: true,
        };
      }

      if (key === "name") {
        const nextState = { ...previous, name: value };
        const previousAutoSlug = slugify(previous.name);

        if (
          previous.mode === "create" &&
          (!previous.slugManuallyEdited ||
            !previous.slug ||
            previous.slug === previousAutoSlug)
        ) {
          nextState.slug = slugify(value);
          nextState.slugManuallyEdited = false;
        }

        return nextState;
      }

      return { ...previous, [key]: value };
    });
  };

  const handleSectionFormChange = (key, value) => {
    setSectionForm((previous) => {
      if (key === "slug") {
        return {
          ...previous,
          slug: slugify(value),
          slugManuallyEdited: true,
        };
      }

      if (key === "name") {
        const nextState = { ...previous, name: value };
        const previousAutoSlug = slugify(previous.name);

        if (
          previous.mode === "create" &&
          (!previous.slugManuallyEdited ||
            !previous.slug ||
            previous.slug === previousAutoSlug)
        ) {
          nextState.slug = slugify(value);
          nextState.slugManuallyEdited = false;
        }

        return nextState;
      }

      return { ...previous, [key]: value };
    });
  };

  const handleAppendImages = (files) => {
    if (!files.length) return;

    const invalidFile = files.find((file) => {
      const fileName = String(file?.name || "").toLowerCase();
      const isValidExtension = [".jpg", ".jpeg", ".png", ".webp"].some(
        (extension) => fileName.endsWith(extension),
      );

      return !isValidExtension || Number(file?.size || 0) > 5 * 1024 * 1024;
    });

    if (invalidFile) {
      setProductFormError(
        "ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ط§ظ„طµظˆط± ط¨طµظٹط؛ط© JPG ط£ظˆ JPEG ط£ظˆ PNG ط£ظˆ WEBPطŒ ظˆط¨ط­ط¬ظ… ظ„ط§ ظٹطھط¬ط§ظˆط² 5MB ظ„ظ„طµظˆط±ط©.",
      );
      return;
    }

    setProductFormError("");

    setProductForm((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  const handleRemoveNewImage = (index) => {
    setProductForm((prev) => ({
      ...prev,
      newImages: prev.newImages.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  const handleDeleteExistingImage = async (image) => {
    if (!productForm.id || !image?.id) return;
    if (!window.confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ظ‡ ط§ظ„طµظˆط±ط© ظ…ظ† ط§ظ„ظ…ظ†طھط¬طں")) return;

    try {
      await deleteProductImageMutation.mutateAsync({
        imageId: image.id,
        productId: productForm.id,
      });

      setProductForm((prev) => {
        const remainingImages = prev.existingImages.filter(
          (item) => item.id !== image.id,
        );

        return {
          ...prev,
          existingImages:
            image.isPrimary && remainingImages.length
              ? remainingImages.map((item, index) => ({
                  ...item,
                  isPrimary: index === 0,
                }))
              : remainingImages,
        };
      });
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();

    if (!storeId) return;
    if (!categoriesRaw.length || !sectionsRaw.length) return;

    setProductFormError("");

    const payload = {
      Name: productForm.name.trim(),
      Slug: slugify(productForm.slug || productForm.name),
      SKU: productForm.mode === "create" ? productForm.sku.trim() || undefined : undefined,
      ShortDescription: productForm.shortDescription || undefined,
      Description: productForm.description || undefined,
      Price: Number(productForm.price),
      CompareAtPrice: productForm.compareAtPrice
        ? Number(productForm.compareAtPrice)
        : undefined,
      CostPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined,
      StockQuantity: Number(productForm.stockQuantity),
      TrackInventory: Boolean(productForm.trackInventory),
      CategoryId: productForm.categoryId || defaultCategoryId,
      SectionId: productForm.sectionId || defaultSectionId,
      StoreId: storeId,
      MetaTitle: productForm.metaTitle.trim() || undefined,
      MetaDescription: productForm.metaDescription.trim() || undefined,
    };

    try {
      if (productForm.mode === "edit" && productForm.id) {
        await updateProductMutation.mutateAsync({
          productId: productForm.id,
          payload: {
            Name: payload.Name,
            ShortDescription: payload.ShortDescription,
            Description: payload.Description,
            Price: payload.Price,
            CompareAtPrice: payload.CompareAtPrice,
            CostPrice: payload.CostPrice,
            StockQuantity: payload.StockQuantity,
            TrackInventory: payload.TrackInventory,
            CategoryId: payload.CategoryId,
            SectionId: payload.SectionId,
            Status: Number(productForm.status),
            IsFeatured: Boolean(productForm.isFeatured),
            MetaTitle: payload.MetaTitle,
            MetaDescription: payload.MetaDescription,
          },
        });

        for (const [index, file] of productForm.newImages.entries()) {
          await uploadProductImageMutation.mutateAsync({
            ProductId: productForm.id,
            Image: file,
            AltText: productForm.name,
            DisplayOrder: productForm.existingImages.length + index + 1,
            IsPrimary: productForm.existingImages.length === 0 && index === 0,
          });
        }

        resetProductForm();
        return;
      }

      const createdProduct = await createProductMutation.mutateAsync({
        ...payload,
        Images: productForm.newImages.length
          ? productForm.newImages
          : undefined,
      });

      const createdProductEntity = normalizeProductDto(createdProduct);
      const createdProductId = createdProductEntity?.id || createdProduct?.id;

      if (createdProductId) {
        await updateProductMutation.mutateAsync({
          productId: createdProductId,
          payload: {
            Status: productForm.publishNow ? 1 : 0,
            IsFeatured: Boolean(productForm.isFeatured),
          },
        });
      }

      resetProductForm();
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleSubmitCategory = async (event) => {
    event.preventDefault();
    if (!storeId) return;

    try {
      if (categoryForm.mode === "edit" && categoryForm.id) {
        await updateCategoryMutation.mutateAsync({
          id: categoryForm.id,
          payload: {
            Name: categoryForm.name.trim(),
            Description: categoryForm.description || undefined,
            DisplayOrder: Number(categoryForm.displayOrder || 0),
            ParentCategoryId: categoryForm.parentCategoryId || undefined,
            ClearParentCategory: !categoryForm.parentCategoryId,
            IsActive: categoryForm.isActive,
          },
        });

        resetCategoryForm();
        return;
      }

      const createdCategory = await createCategoryMutation.mutateAsync({
        name: categoryForm.name.trim(),
        slug: slugify(categoryForm.slug || categoryForm.name),
        description: categoryForm.description || undefined,
        displayOrder: Number(categoryForm.displayOrder || 1),
        storeId,
      });

      if (
        createdCategory?.id &&
        (categoryForm.parentCategoryId || !categoryForm.isActive)
      ) {
        await updateCategoryMutation.mutateAsync({
          id: createdCategory.id,
          payload: {
            ParentCategoryId: categoryForm.parentCategoryId || undefined,
            ClearParentCategory: !categoryForm.parentCategoryId,
            IsActive: categoryForm.isActive,
          },
        });
      }

      resetCategoryForm();
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleSubmitSection = async (event) => {
    event.preventDefault();
    if (!storeId) return;

    try {
      if (sectionForm.mode === "edit" && sectionForm.id) {
        await updateSectionMutation.mutateAsync({
          id: sectionForm.id,
          payload: {
            Name: sectionForm.name.trim(),
            Description: sectionForm.description || undefined,
            DisplayOrder: Number(sectionForm.displayOrder || 0),
            IsActive: sectionForm.isActive,
          },
        });

        resetSectionForm();
        return;
      }

      const createdSection = await createSectionMutation.mutateAsync({
        Name: sectionForm.name.trim(),
        Slug: slugify(sectionForm.slug || sectionForm.name),
        Description: sectionForm.description || undefined,
        DisplayOrder: Number(sectionForm.displayOrder || 0),
        StoreId: storeId,
      });

      if (createdSection?.id && !sectionForm.isActive) {
        await updateSectionMutation.mutateAsync({
          id: createdSection.id,
          payload: {
            IsActive: false,
          },
        });
      }

      resetSectionForm();
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleSubmitCoupon = async (event) => {
    event.preventDefault();
    if (!storeId) return;

    const payload = {
      code: couponForm.code,
      discountType: Number(couponForm.discountType),
      discountValue: Number(couponForm.discountValue),
      isActive: couponForm.isActive,
      storeId,
    };

    try {
      if (couponForm.mode === "edit" && couponForm.id) {
        await updateCouponMutation.mutateAsync({
          id: couponForm.id,
          payload,
        });
        resetCouponForm();
        return;
      }

      await createCouponMutation.mutateAsync(payload);
      resetCouponForm();
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleSubmitCustomerStore = async (event) => {
    event.preventDefault();
    if (!storeId) return;
    if (!customerStoreForm.id) return;

    try {
      await updateCustomerStoreMutation.mutateAsync({
        id: customerStoreForm.id,
        payload: {
          discountPercentage: toNumber(customerStoreForm.discountPercentage, 0),
          isActive: customerStoreForm.isActive,
        },
      });
      resetCustomerStoreForm();
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const openCustomerStoreEditor = (row) => {
    setCustomerStoreForm({
      mode: "edit",
      id: row.id,
      fullName: row.fullName || row.name || "",
      email: row.email || "",
      phone: row.phone === "-" ? "" : row.phone || "",
      discountPercentage: String(row.discountPercentage ?? 0),
      isActive: Boolean(row.isActive),
    });
  };
  const handleSelectAvailableCustomer = () => {};
  const customerColumns = [
    {
      key: "fullName",
      title: "ط§ظ„ط¹ظ…ظٹظ„",
      render: (row) => (
        <Stack spacing={0.3}>
          <Typography variant="body2" fontWeight={700}>
            {row.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "phone",
      title: "ط§ظ„ظ‡ط§طھظپ",
      render: (row) => row.phone || "-",
    },
    {
      key: "discountPercentage",
      title: "ط®طµظ… ط§ظ„ط¬ظ…ظ„ط©",
      render: (row) => formatDiscountPercentage(row.discountPercentage),
    },
    {
      key: "isActive",
      title: "ط§ظ„ط­ط§ظ„ط©",
      render: (row) => (
        <Chip
          size="small"
          label={row.isActive ? "ظ…ظپط¹ظ„" : "ظ…طھظˆظ‚ظپ"}
          color={row.isActive ? "primary" : "default"}
          variant={row.isActive ? "filled" : "outlined"}
        />
      ),
    },
    {
      key: "actions",
      title: "ط¥ط¬ط±ط§ط،ط§طھ",
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <AppButton
            size="small"
            variant="outlined"
            onClick={() => openCustomerStoreEditor(row)}
          >
            طھط¹ط¯ظٹظ„
          </AppButton>
          <AppButton
            size="small"
            variant="outlined"
            color="error"
            loading={
              deleteCustomerStoreMutation.isPending &&
              deleteCustomerStoreMutation.variables === row.id
            }
            onClick={() =>
              confirmDelete(
                `ط§ظ„ط¹ظ…ظٹظ„ ${row.fullName}`,
                deleteCustomerStoreMutation,
                row.id,
              )
            }
          >
            ط­ط°ظپ
          </AppButton>
        </Stack>
      ),
    },
  ];
  const orderColumns = [
    { key: "orderNumber", title: "ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨" },
    {
      key: "itemsCount",
      title: "ط§ظ„ط¹ظ†ط§طµط±",
      render: (row) => row.itemsCount ?? 0,
    },
    {
      key: "totalAmount",
      title: "ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ",
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: "statusLabel",
      title: "ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©",
      render: (row) => row.statusLabel || "ط؛ظٹط± ظ…ط­ط¯ط¯ط©",
    },
    {
      key: "createdAtLabel",
      title: "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،",
      render: (row) => row.createdAtLabel,
    },
    {
      key: "actions",
      title: "طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط©",
      render: (row) => (
        <TextField
          select
          size="small"
          value={String(row.status ?? 0)}
          onChange={(event) =>
            updateOrderStatusMutation.mutate({
              orderId: row.id,
              payload: { status: Number(event.target.value) },
            })
          }
          sx={{ minWidth: 180 }}
        >
          {ORDER_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={String(option.value)}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ),
    },
  ];
  const reviewColumns = [
    {
      key: "storeCustomerFullName",
      title: "ط§ظ„ط¹ظ…ظٹظ„",
      render: (row) => row.storeCustomerFullName || "ط¹ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±",
    },
    {
      key: "productId",
      title: "ظ…ط¹ط±ظپ ط§ظ„ظ…ظ†طھط¬",
      render: (row) => row.productId,
    },
    { key: "rating", title: "ط§ظ„طھظ‚ظٹظٹظ…" },
    { key: "comment", title: "ط§ظ„طھط¹ظ„ظٹظ‚" },
    {
      key: "isApproved",
      title: "ط§ظ„ط­ط§ظ„ط©",
      render: (row) => (
        <Chip
          size="small"
          label={row.isApproved ? "ظ…ط¹طھظ…ط¯" : "ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯"}
          color={row.isApproved ? "primary" : "default"}
          variant={row.isApproved ? "filled" : "outlined"}
        />
      ),
    },
    {
      key: "actions",
      title: "ط¥ط¬ط±ط§ط،ط§طھ",
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <AppButton
            size="small"
            variant="outlined"
            onClick={() =>
              updateReviewApprovalMutation.mutate({
                reviewId: row.id,
                payload: { isApproved: true },
              })
            }
          >
            ط§ط¹طھظ…ط§ط¯
          </AppButton>
          <AppButton
            size="small"
            variant="outlined"
            color="warning"
            onClick={() =>
              updateReviewApprovalMutation.mutate({
                reviewId: row.id,
                payload: { isApproved: false },
              })
            }
          >
            ط±ظپط¶
          </AppButton>
        </Stack>
      ),
    },
  ];

  return (
    <DashboardLayout
      sidebar={
        !isCompactScreen ? (
          <DashboardSidebar
            store={store}
            activeTab={activeTab}
            items={sidebarItems}
            onNavigate={handleSidebarNavigate}
          />
        ) : null
      }
    >
      <Box className="owner-dashboard">
        {isCompactScreen ? (
          <>
            <button
              type="button"
              className={`owner-mobile-launcher${
                isMobileSidebarDragging ? " owner-mobile-launcher--dragging" : ""
              }`}
              style={{ top: `${mobileSidebarLauncherTop}px` }}
              onClick={handleMobileSidebarLauncherClick}
              onPointerDown={handleMobileSidebarPointerDown}
              onPointerMove={handleMobileSidebarPointerMove}
              onPointerUp={handleMobileSidebarPointerUp}
              onPointerCancel={handleMobileSidebarPointerCancel}
              aria-label="ظپطھط­ ط¥ط¯ط§ط±ط© ط§ظ„ظ…طھط¬ط±"
            >
              <span className="owner-mobile-launcher__icon" aria-hidden>
                <AdminPanelSettingsRoundedIcon fontSize="small" />
              </span>
              <span className="owner-mobile-launcher__text">ط¥ط¯ط§ط±ط© ط§ظ„ظ…طھط¬ط±</span>
              <span className="owner-mobile-launcher__drag" aria-hidden>
                <DragIndicatorRoundedIcon fontSize="inherit" />
              </span>
            </button>

            <Drawer
              anchor="right"
              open={isMobileSidebarOpen}
              onClose={() => setIsMobileSidebarOpen(false)}
              slotProps={{
                paper: {
                  className: "owner-mobile-drawer__paper",
                },
              }}
            >
              <Box className="owner-mobile-drawer__header">
                <Box>
                  <Typography
                    variant="overline"
                    className="owner-mobile-drawer__eyebrow"
                  >
                    ط¥ط¯ط§ط±ط© ط§ظ„ظ…طھط¬ط±
                  </Typography>
                  <Typography variant="h6">
                    {store?.name || "ظ…طھط¬ط±ظƒ"}
                  </Typography>
                </Box>

                <IconButton
                  aria-label="ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¥ط¯ط§ط±ظٹط©"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Box>

              <DashboardSidebar
                store={store}
                activeTab={activeTab}
                items={sidebarItems}
                onNavigate={handleSidebarNavigate}
              />
            </Drawer>
          </>
        ) : null}

        <Paper className="owner-topbar" elevation={0}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            gap={2}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <AppButton
                component={RouterLink}
                to="/owner/subscription"
                variant={
                  activeTab === "subscription" ? "contained" : "outlined"
                }
                startIcon={<WorkspacePremiumRoundedIcon fontSize="small" />}
              >
                ط§ظ„ط¨ط§ظ‚ط§طھ
              </AppButton>

              <ContactDeveloperButton
                label="طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ظ…ط·ظˆط±"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper className="owner-hero" elevation={0}>
          <Box className="owner-hero__copy">
            <Typography variant="overline" className="owner-hero__eyebrow">
              ظ…طھط¬ط± ظ…ط±طھط¨طŒ ط¥ط¯ط§ط±ط© ط£ط³ط±ط¹
            </Typography>
            <Typography variant="h3" className="owner-hero__title">
              ظƒظ„ ظ…ط§ طھط­طھط§ط¬ظ‡ ظ„ط¥ط¯ط§ط±ط© ظ…طھط¬ط±ظƒ ظپظٹ ط´ط§ط´ط© ظˆط§ط­ط¯ط©
            </Typography>
            <Typography variant="body1" className="owner-hero__desc">
              ط±طھظ‘ط¨ ط§ظ„ظ…ظ†طھط¬ط§طھطŒ طھط§ط¨ط¹ ط§ظ„ط·ظ„ط¨ط§طھطŒ ظˆظ†ط³ظ‘ظ‚ ط§ظ„طھطµظ†ظٹظپط§طھ ظˆط§ظ„ط¹ط±ظˆط¶ ظ…ظ† ظ…ط³ط§ط­ط© ط£ظˆط¶ط­
              طھط³ط§ط¹ط¯ظƒ ط¹ظ„ظ‰ ط§ظ„ط¹ظ…ظ„ ط¨ط³ط±ط¹ط© ظˆط±ط§ط­ط©.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<VisibilityRoundedIcon fontSize="small" />}
                label={`${store.visitCount ?? 0} ط²ظٹط§ط±ط©`}
              />
              <Chip
                label={`${productsRaw.length} ظ…ظ†طھط¬ ظ…ظ†ط´ظˆط±`}
                variant="outlined"
              />
              <Chip label={`${sectionsRaw.length} ظ‚ط³ظ…`} variant="outlined" />
            </Stack>
          </Box>

          <Box className="owner-hero__actions">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="ط§ط¨ط­ط« ط¯ط§ط®ظ„ ط§ظ„طھط¨ظˆظٹط¨ ط§ظ„ط­ط§ظ„ظٹ..."
            />

            <Stack direction="row" spacing={1}>
              <AppButton
                component={RouterLink}
                to={
                  store.slug
                    ? {
                        pathname: `/market/${store.slug}`,
                        search: OWNER_PREVIEW_SEARCH,
                      }
                      : "/"
                }
                variant="outlined"
              >
                ط¹ط±ط¶ ط§ظ„ظ…طھط¬ط± ظƒط²ط§ط¦ط±
              </AppButton>
              <AppButton
                component={RouterLink}
                to="/"
                sx={{ display: "none" }}
                variant="contained"
              >
                ط§ظ„ط³ظˆظ‚
              </AppButton>
            </Stack>
          </Box>
        </Paper>

        {mutationError ? (
          <Alert severity="error">{getApiErrorMessage(mutationError)}</Alert>
        ) : null}

        {activeTab === "overview" ? (
          <>
            <Paper className="owner-store-banner" elevation={0}>
              <Box className="owner-store-banner__content">
                <Box>
                  <Typography variant="h5">{store.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {store.description || "ظ„ظ… ظٹطھظ… ط¥ط¶ط§ظپط© ظˆطµظپ ظ„ظ„ظ…طھط¬ط± ط¨ط¹ط¯."}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {store.slug ? (
                    <Chip label={`/${store.slug}`} variant="outlined" />
                  ) : null}
                  {store.businessType ? (
                    <Chip label={store.businessType} />
                  ) : null}
                  <Chip
                    label={store.isActive ? "ط§ظ„ظ…طھط¬ط± ظ†ط´ط·" : "ط§ظ„ظ…طھط¬ط± ط؛ظٹط± ظ†ط´ط·"}
                    color={store.isActive ? "primary" : "default"}
                    variant={store.isActive ? "filled" : "outlined"}
                  />
                </Stack>
              </Box>
            </Paper>

            <Box className="owner-stats-grid">
              {overviewStats.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </Box>
          </>
        ) : null}

        {activeTab === "subscription" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط§ط´طھط±ط§ظƒ ط§ظ„ظ…طھط¬ط±"
              description="ط§ط®طھط± ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ط£ظ†ط³ط¨ ظ„ظ…ط±ط­ظ„ط© ظ†ظ…ظˆ ظ…طھط¬ط±ظƒطŒ ظˆظٹظ…ظƒظ†ظƒ ط§ظ„طھط¨ط¯ظٹظ„ ظپظٹ ط£ظٹ ظˆظ‚طھ."
              onRefresh={subscriptionQuery.refetch}
              isRefreshing={subscriptionQuery.isFetching}
            />

            {subscriptionSuccessMessage ? (
              <Alert severity="success">{subscriptionSuccessMessage}</Alert>
            ) : null}

            {subscriptionQuery.error ? (
              <Alert severity="warning">
                {getApiErrorMessage(subscriptionQuery.error)}
              </Alert>
            ) : null}

            {subscriptionQuery.isLoading ? (
              <LoadingState label="ط¬ط§ط±ظچ طھط­ظ…ظٹظ„ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط§ط´طھط±ط§ظƒ..." />
            ) : (
              <>
                <Alert severity="info" className="owner-inline-alert">
                  ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ظ†ط´ط·ط© ط­ط§ظ„ظٹظ‹ط§: {activePlan.label}
                  {subscription.renewalAt
                    ? ` â€¢ طھط§ط±ظٹط® ط§ظ„طھط¬ط¯ظٹط¯: ${formatDateTimeLabel(subscription.renewalAt)}`
                    : ""}
                </Alert>

                <Box
                  className="owner-subscription-grid"
                  role="radiogroup"
                  aria-label="ط®ظٹط§ط±ط§طھ ط¨ط§ظ‚ط§طھ ط§ظ„ط§ط´طھط±ط§ظƒ"
                >
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const isActivePlan = plan.key === subscription.currentPlan;
                    const isSelectedPlan = plan.key === selectedPlanKey;
                    const isPendingPlan =
                      changeSubscriptionMutation.isPending &&
                      changeSubscriptionMutation.variables?.planKey ===
                        plan.key;

                    return (
                      <Paper
                        key={plan.key}
                        elevation={0}
                        className={`owner-subscription-card${
                          isActivePlan ? " owner-subscription-card--active" : ""
                        }${isSelectedPlan ? " owner-subscription-card--selected" : ""}`}
                        role="radio"
                        aria-checked={isSelectedPlan}
                        tabIndex={0}
                        onClick={() => setSelectedPlanKey(plan.key)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedPlanKey(plan.key);
                          }
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="h6">{plan.label}</Typography>
                          {isActivePlan ? (
                            <Chip
                              size="small"
                              color="primary"
                              label="ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ط­ط§ظ„ظٹط©"
                            />
                          ) : null}
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          {plan.nameAr}
                        </Typography>

                        <Typography
                          variant="h5"
                          className="owner-subscription-card__price"
                        >
                          {plan.priceLabel}
                        </Typography>

                        <Box
                          component="ul"
                          className="owner-subscription-card__list"
                        >
                          {plan.details.map((detail) => (
                            <li key={detail}>
                              <Typography variant="body2">{detail}</Typography>
                            </li>
                          ))}
                        </Box>

                        <AppButton
                          fullWidth
                          variant={isActivePlan ? "outlined" : "contained"}
                          disabled={
                            isActivePlan || changeSubscriptionMutation.isPending
                          }
                          loading={isPendingPlan}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleChangeSubscription(plan.key);
                          }}
                          aria-label={`طھط؛ظٹظٹط± ط§ظ„ط¨ط§ظ‚ط© ط¥ظ„ظ‰ ${plan.label}`}
                        >
                          {isActivePlan
                            ? "ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ط­ط§ظ„ظٹط©"
                            : "طھط؛ظٹظٹط± ط¥ظ„ظ‰ ظ‡ط°ظ‡ ط§ظ„ط¨ط§ظ‚ط©"}
                        </AppButton>
                      </Paper>
                    );
                  })}
                </Box>

                {selectedPlanKey &&
                selectedPlanKey !== subscription.currentPlan ? (
                  <Paper className="owner-subscription-confirm" elevation={0}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={2}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ظ…ط­ط¯ط¯ط©:{" "}
                        {
                          SUBSCRIPTION_PLANS.find(
                            (item) => item.key === selectedPlanKey,
                          )?.label
                        }
                      </Typography>
                      <AppButton
                        onClick={() =>
                          handleChangeSubscription(selectedPlanKey)
                        }
                        loading={changeSubscriptionMutation.isPending}
                      >
                        طھط£ظƒظٹط¯ طھط؛ظٹظٹط± ط§ظ„ط¨ط§ظ‚ط©
                      </AppButton>
                    </Stack>
                  </Paper>
                ) : null}
              </>
            )}
          </Paper>
        ) : null}

        {activeTab === "products" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طھط¬ط§طھ"
              description="ط¥ط¶ط§ظپط© ظ…ظ†طھط¬ط§طھ ط£ظˆ طھط¹ط¯ظٹظ„ظ‡ط§ ظ…ط¹ ط¯ط¹ظ… طµظˆط± ظ…طھط¹ط¯ط¯ط© ظˆظ†ط´ط± ظ…ط¨ط§ط´ط±."
              onRefresh={productsQuery.refetch}
              isRefreshing={productsQuery.isFetching}
            />

            {productFormError ? (
              <Alert severity="error">{productFormError}</Alert>
            ) : null}

            <ProductForm
              form={productForm}
              isEdit={productForm.mode === "edit"}
              loading={
                createProductMutation.isPending ||
                updateProductMutation.isPending ||
                uploadProductImageMutation.isPending
              }
              storeSlug={store.slug || ""}
              categories={categoryOptions}
              sections={sectionsRaw}
              categoryHint={categoryHint}
              newImagePreviews={newImagePreviews}
              defaultCategoryId={defaultCategoryId}
              defaultSectionId={defaultSectionId}
              onChange={handleProductFormChange}
              onAppendImages={handleAppendImages}
              onRemoveNewImage={handleRemoveNewImage}
              onDeleteExistingImage={handleDeleteExistingImage}
              deletingImageId={
                deleteProductImageMutation.isPending
                  ? deleteProductImageMutation.variables?.imageId
                  : null
              }
              onReset={resetProductForm}
              onSubmit={handleSubmitProduct}
            />

            {productsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={products}
                columns={[
                  {
                    key: "name",
                    title: "ط§ظ„ظ…ظ†طھط¬",
                    render: (row) => (
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box className="owner-thumb-wrap">
                          {row.thumbnailUrl ? (
                            <Box
                              component="img"
                              src={resolveAssetUrl(row.thumbnailUrl)}
                              alt={row.name}
                              className="owner-thumb"
                            />
                          ) : (
                            <Box className="owner-thumb owner-thumb--empty">
                              <Inventory2RoundedIcon fontSize="small" />
                            </Box>
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {row.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.shortDescription || row.slug}
                          </Typography>
                        </Box>
                      </Stack>
                    ),
                  },
                  {
                    key: "categoryName",
                    title: "ط§ظ„طھطµظ†ظٹظپ",
                    render: (row) => (
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
                          {categoryLookup.get(row.categoryId)?.pathLabel ||
                            row.categoryName ||
                            "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sectionLookup.get(row.sectionId)?.name ||
                            row.sectionName ||
                            "-"}
                        </Typography>
                      </Stack>
                    ),
                  },
                  {
                    key: "price",
                    title: "ط§ظ„ط³ط¹ط±",
                    render: (row) => (
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(row.price)}
                        </Typography>
                        {row.compareAtPrice ? (
                          <Typography variant="caption" color="text.secondary">
                            ظ‚ط¨ظ„ ط§ظ„ط®طµظ…: {formatCurrency(row.compareAtPrice)}
                          </Typography>
                        ) : null}
                      </Stack>
                    ),
                  },
                  {
                    key: "status",
                    title: "ط§ظ„ط­ط§ظ„ط©",
                    render: (row) => (
                      <Stack spacing={0.4}>
                        <Chip
                          size="small"
                          label={formatProductStatus(row.status)}
                          color={
                            Number(row.status) === 1 ? "primary" : "default"
                          }
                          variant={
                            Number(row.status) === 1 ? "filled" : "outlined"
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {row.images?.length ?? 0} طµظˆط±ط©
                        </Typography>
                      </Stack>
                    ),
                  },
                  { key: "stockQuantity", title: "ط§ظ„ظ…ط®ط²ظˆظ†" },
                  {
                    key: "actions",
                    title: "ط¥ط¬ط±ط§ط،ط§طھ",
                    render: (row) => (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          size="small"
                          variant="outlined"
                          loading={editingProductId === row.id}
                          onClick={() => handleOpenProductEditor(row)}
                        >
                          طھط¹ط¯ظٹظ„
                        </AppButton>
                        <AppButton
                          size="small"
                          variant="outlined"
                          color="error"
                          loading={
                            deleteProductMutation.isPending &&
                            deleteProductMutation.variables === row.id
                          }
                          onClick={() =>
                            confirmDelete(
                              `ط§ظ„ظ…ظ†طھط¬ ${row.name}`,
                              deleteProductMutation,
                              row.id,
                            )
                          }
                        >
                          ط­ط°ظپ
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="ظ„ط§ طھظˆط¬ط¯ ظ…ظ†طھط¬ط§طھ ظ…ظ†ط´ظˆط±ط©"
                    description="ط§ط¨ط¯ط£ ط¨ط¥ط¶ط§ظپط© ط£ظˆظ„ ظ…ظ†طھط¬طŒ ظˆط³ظٹطھظ… ظ†ط´ط±ظ‡ ظ…ط¨ط§ط´ط±ط© ط¥ط°ط§ ط£ط¨ظ‚ظٹطھ ط®ظٹط§ط± ط§ظ„ظ†ط´ط± ط§ظ„ظ…ط¨ط§ط´ط± ظ…ظپط¹ظ‘ظ„ظ‹ط§."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "categories" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط¥ط¯ط§ط±ط© ط§ظ„طھطµظ†ظٹظپط§طھ"
              description="ط¥ظ†ط´ط§ط، طھطµظ†ظٹظپط§طھ ط±ط¦ظٹط³ظٹط© ظˆظپط±ط¹ظٹط© ط¨ط´ظƒظ„ ظ‡ط±ظ…ظٹ ظˆظˆط§ط¶ط­."
              onRefresh={categoriesQuery.refetch}
              isRefreshing={categoriesQuery.isFetching}
            />

            <CategoryForm
              form={categoryForm}
              isEdit={categoryForm.mode === "edit"}
              categories={categoryOptions}
              loading={
                createCategoryMutation.isPending ||
                updateCategoryMutation.isPending
              }
              slugPreview={categoryForm.slug || categoryForm.name || "category"}
              onChange={handleCategoryFormChange}
              onReset={resetCategoryForm}
              onSubmit={handleSubmitCategory}
            />

            <Divider />

            {categoriesQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={categories}
                columns={[
                  {
                    key: "name",
                    title: "ط§ظ„طھطµظ†ظٹظپ",
                    render: (row) => (
                      <Stack spacing={0.3}>
                        <Typography variant="body2" fontWeight={700}>
                          {row.pathLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ط§ظ„ظ…ط³طھظˆظ‰: {row.depth + 1}
                        </Typography>
                      </Stack>
                    ),
                  },
                  { key: "slug", title: "ط§ظ„ط±ط§ط¨ط·" },
                  {
                    key: "parentCategoryName",
                    title: "ط§ظ„ط£ط¨",
                    render: (row) => row.parentCategoryName || "ط±ط¦ظٹط³ظٹ",
                  },
                  {
                    key: "isActive",
                    title: "ط§ظ„ط­ط§ظ„ط©",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isActive ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}
                        color={row.isActive ? "primary" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "ط¥ط¬ط±ط§ط،ط§طھ",
                    render: (row) => (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setCategoryForm({
                              mode: "edit",
                              id: row.id,
                              name: row.name || "",
                              slug: row.slug || "",
                              slugManuallyEdited: true,
                              description: row.description || "",
                              displayOrder: String(row.displayOrder ?? 0),
                              parentCategoryId: row.parentCategoryId || "",
                              isActive: Boolean(row.isActive),
                            })
                          }
                        >
                          طھط¹ط¯ظٹظ„
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="ظ„ط§ طھظˆط¬ط¯ طھطµظ†ظٹظپط§طھ"
                    description="ط£ظ†ط´ط¦ طھطµظ†ظٹظپظ‹ط§ ط±ط¦ظٹط³ظٹظ‹ط§ ط£ظˆ ظپط±ط¹ظٹظ‹ط§ ظ„طھظ†ط¸ظٹظ… ظ…ظ†طھط¬ط§طھ ط§ظ„ظ…طھط¬ط±."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "sections" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط¥ط¯ط§ط±ط© ط§ظ„ط£ظ‚ط³ط§ظ…"
              description="ط§ظ„ط£ظ‚ط³ط§ظ… طھط³ط§ط¹ط¯ ظپظٹ طھظˆط²ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ ط¹ظ„ظ‰ ظˆط§ط¬ظ‡ط© ط§ظ„ظ…طھط¬ط± ط¨ط´ظƒظ„ ط£ظˆط¶ط­."
              onRefresh={sectionsQuery.refetch}
              isRefreshing={sectionsQuery.isFetching}
            />

            <SectionForm
              form={sectionForm}
              isEdit={sectionForm.mode === "edit"}
              loading={
                createSectionMutation.isPending ||
                updateSectionMutation.isPending
              }
              slugPreview={sectionForm.slug || sectionForm.name || "section"}
              onChange={handleSectionFormChange}
              onReset={resetSectionForm}
              onSubmit={handleSubmitSection}
            />

            <Divider />

            {sectionsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={sections}
                columns={[
                  { key: "name", title: "ط§ظ„ظ‚ط³ظ…" },
                  { key: "slug", title: "ط§ظ„ط±ط§ط¨ط·" },
                  { key: "displayOrder", title: "ط§ظ„طھط±طھظٹط¨" },
                  {
                    key: "isActive",
                    title: "ط§ظ„ط­ط§ظ„ط©",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isActive ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}
                        color={row.isActive ? "primary" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "ط¥ط¬ط±ط§ط،ط§طھ",
                    render: (row) => (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setSectionForm({
                              mode: "edit",
                              id: row.id,
                              name: row.name || "",
                              slug: row.slug || "",
                              slugManuallyEdited: true,
                              description: row.description || "",
                              displayOrder: String(row.displayOrder ?? 0),
                              isActive: Boolean(row.isActive),
                            })
                          }
                        >
                          طھط¹ط¯ظٹظ„
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="ظ„ط§ طھظˆط¬ط¯ ط£ظ‚ط³ط§ظ…"
                    description="ط£ط¶ظپ ظ‚ط³ظ…ظ‹ط§ ظˆط§ط­ط¯ظ‹ط§ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ ط­طھظ‰ طھطھظ…ظƒظ† ظ…ظ† طھظˆط²ظٹط¹ ط§ظ„ظ…ظ†طھط¬ط§طھ ط¯ط§ط®ظ„ ط§ظ„ظˆط§ط¬ظ‡ط©."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "coupons" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط¥ط¯ط§ط±ط© ط§ظ„ظƒظˆط¨ظˆظ†ط§طھ"
              description="ط£ظ†ط´ط¦ ط¹ط±ظˆط¶ظ‹ط§ ط³ط±ظٹط¹ط© ظˆظˆط§ط¶ط­ط© ظٹظ…ظƒظ† طھظپط¹ظٹظ„ظ‡ط§ ط£ظˆ طھط¹ط·ظٹظ„ظ‡ط§ ظ…ط¨ط§ط´ط±ط©."
              onRefresh={couponsQuery.refetch}
              isRefreshing={couponsQuery.isFetching}
            />

            <CouponForm
              form={couponForm}
              isEdit={couponForm.mode === "edit"}
              loading={
                createCouponMutation.isPending || updateCouponMutation.isPending
              }
              onChange={(key, value) =>
                setCouponForm((prev) => ({ ...prev, [key]: value }))
              }
              onReset={resetCouponForm}
              onSubmit={handleSubmitCoupon}
            />

            <Divider />

            {couponsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={coupons}
                columns={[
                  { key: "code", title: "ط§ظ„ظƒظˆط¯" },
                  {
                    key: "discountValue",
                    title: "ط§ظ„ط®طµظ…",
                    render: (row) =>
                      Number(row.discountType) === 0
                        ? `${row.discountValue}%`
                        : formatCurrency(row.discountValue),
                  },
                  {
                    key: "discountType",
                    title: "ط§ظ„ظ†ظˆط¹",
                    render: (row) =>
                      Number(row.discountType) === 0
                        ? "ظ†ط³ط¨ط© ظ…ط¦ظˆظٹط©"
                        : "ظ‚ظٹظ…ط© ط«ط§ط¨طھط©",
                  },
                  {
                    key: "isActive",
                    title: "ط§ظ„ط­ط§ظ„ط©",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isActive ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}
                        color={row.isActive ? "primary" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "ط¥ط¬ط±ط§ط،ط§طھ",
                    render: (row) => (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setCouponForm({
                              mode: "edit",
                              id: row.id,
                              code: row.code || "",
                              discountType: String(row.discountType ?? 0),
                              discountValue: String(row.discountValue ?? ""),
                              isActive: Boolean(row.isActive),
                            })
                          }
                        >
                          طھط¹ط¯ظٹظ„
                        </AppButton>
                        <AppButton
                          size="small"
                          variant="outlined"
                          color="error"
                          loading={
                            deleteCouponMutation.isPending &&
                            deleteCouponMutation.variables === row.id
                          }
                          onClick={() =>
                            confirmDelete(
                              `ط§ظ„ظƒظˆط¨ظˆظ† ${row.code}`,
                              deleteCouponMutation,
                              row.id,
                            )
                          }
                        >
                          ط­ط°ظپ
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="ظ„ط§ طھظˆط¬ط¯ ظƒظˆط¨ظˆظ†ط§طھ"
                    description="ط£ط¶ظپ ط£ظˆظ„ ظƒظˆط¨ظˆظ† ظ„طھط³ظ‡ظٹظ„ ط§ظ„ط¹ط±ظˆط¶ ظˆط§ظ„طھط­ظپظٹط² ط¹ظ„ظ‰ ط§ظ„ط´ط±ط§ط،."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "customers" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط²ط¨ط§ط¦ظ† ط§ظ„ظ…طھط¬ط± ظˆط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط©"
              description="ط§ط®طھط± ظ…ظ† ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ط§ظ„ظ…ط³ط¬ظ„ظٹظ† ظ…ظ† ظٹط­طµظ„ ط¹ظ„ظ‰ طھط³ط¹ظٹط± ط®ط§طµ ط¯ط§ط®ظ„ ظ…طھط¬ط±ظƒطŒ ط«ظ… ط¹ط¯ظ„ ظ†ط³ط¨ط© ط§ظ„ط®طµظ… ط£ظˆ ط£ظˆظ‚ظپظ‡ط§ ظ…طھظ‰ ط§ط­طھط¬طھ."
              onRefresh={() => {
                storeCustomersQuery.refetch();
              }}
              isRefreshing={storeCustomersQuery.isFetching}
            />

            <Alert severity="info" className="owner-inline-alert">
              ط®طµظ… ط²ط¨ظˆظ† ط§ظ„ظ…طھط¬ط± ظ„ط§ ظٹط¤ط«ط± ط¹ظ„ظ‰ ط´ط§ط´ط© ط§ظ„ط¥ط¯ط§ط±ط© ظپظ‚ط·طŒ ط¨ظ„ ظٹط؛ظٹظ‘ط± ط§ظ„ط³ط¹ط±
              ط§ظ„ط¸ط§ظ‡ط± ظ„ظ„ط¹ظ…ظٹظ„ ط¨ط¹ط¯ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظˆظٹظڈط«ط¨طھ ط¯ط§ط®ظ„ ط§ظ„ط³ظ„ط© ط«ظ… ظٹظ†طھظ‚ظ„ ط¥ظ„ظ‰
              ط§ظ„ط·ظ„ط¨.
            </Alert>

            {customerStoreForm.id ? (
              <CustomerStoreForm
                form={customerStoreForm}
                loading={updateCustomerStoreMutation.isPending}
                onChange={(key, value) =>
                  setCustomerStoreForm((prev) => ({ ...prev, [key]: value }))
                }
                onReset={resetCustomerStoreForm}
                onSubmit={handleSubmitCustomerStore}
              />
            ) : (
              <Alert severity="info" className="owner-inline-alert">
                ط§ط®طھط± ط¹ظ…ظٹظ„ظ‹ط§ ظ…ظ† ط§ظ„ط¬ط¯ظˆظ„ ط¨ط§ظ„ط£ط³ظپظ„ ظ„طھط¹ط¯ظٹظ„ ط§ظ„ط®طµظ… ط£ظˆ ط­ط§ظ„ط© ط§ظ„ط­ط³ط§ط¨. ط¥ظ†ط´ط§ط،
                ط¹ظ…ظٹظ„ ط¬ط¯ظٹط¯ ظ„ظ… ظٹط¹ط¯ ط¬ط²ط،ظ‹ط§ ظ…ظ† ظ‡ط°ظ‡ ط§ظ„ط´ط§ط´ط©.
              </Alert>
            )}

            <Divider />

            <Box className="owner-subsection">
              <Box>
                <Typography variant="h6" className="owner-subsection__title">
                  ط²ط¨ط§ط¦ظ† ط§ظ„ظ…طھط¬ط± ط§ظ„ط­ط§ظ„ظٹظˆظ†
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ظ‡ط¤ظ„ط§ط، ظ‡ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ط§ظ„ط°ظٹظ† ظٹط´ط§ظ‡ط¯ظˆظ† طھط³ط¹ظٹط±ظ‹ط§ ط®ط§طµظ‹ط§ ط¯ط§ط®ظ„ ظ‡ط°ط§
                  ط§ظ„ظ…طھط¬ط±.
                </Typography>
              </Box>

              {storeCustomersQuery.isLoading ? (
                <LoadingState />
              ) : storeCustomersQuery.error ? (
                <Alert severity="error">
                  {getApiErrorMessage(storeCustomersQuery.error)}
                </Alert>
              ) : (
                <AppDataTable
                  rows={customers}
                  columns={[
                    {
                      key: "name",
                      title: "ط§ظ„ط¹ظ…ظٹظ„",
                      render: (row) => (
                        <Stack spacing={0.3}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.email}
                          </Typography>
                        </Stack>
                      ),
                    },
                    {
                      key: "discountPercentage",
                      title: "ط®طµظ… ط§ظ„ط¬ظ…ظ„ط©",
                      render: (row) =>
                        formatDiscountPercentage(row.discountPercentage),
                    },
                    {
                      key: "isActive",
                      title: "ط§ظ„ط­ط§ظ„ط©",
                      render: (row) => (
                        <Chip
                          size="small"
                          label={row.isActive ? "ظ…ظپط¹ظ„" : "ظ…طھظˆظ‚ظپ"}
                          color={row.isActive ? "primary" : "default"}
                          variant={row.isActive ? "filled" : "outlined"}
                        />
                      ),
                    },
                    {
                      key: "actions",
                      title: "ط¥ط¬ط±ط§ط،ط§طھ",
                      render: (row) => (
                        <Stack direction="row" spacing={1}>
                          <AppButton
                            size="small"
                            variant="outlined"
                            onClick={() => openCustomerStoreEditor(row)}
                          >
                            طھط¹ط¯ظٹظ„
                          </AppButton>
                          <AppButton
                            size="small"
                            variant="outlined"
                            color="error"
                            loading={
                              deleteCustomerStoreMutation.isPending &&
                              deleteCustomerStoreMutation.variables === row.id
                            }
                            onClick={() =>
                              confirmDelete(
                                `ط§ظ„ط¹ظ…ظٹظ„ ${row.fullName}`,
                                deleteCustomerStoreMutation,
                                row.id,
                              )
                            }
                          >
                            ط­ط°ظپ
                          </AppButton>
                        </Stack>
                      ),
                    },
                  ]}
                  emptyState={
                    <EmptyState
                      title="ظ„ط§ ظٹظˆط¬ط¯ ط²ط¨ط§ط¦ظ† ظ…طھط¬ط± ط¨ط¹ط¯"
                      description="ط§ط®طھط± ظ…ط³طھط®ط¯ظ…ظ‹ط§ ظ…ط³ط¬ظ„ظ‹ط§ ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط© ط¨ط§ظ„ط£ط³ظپظ„ ظˆط­ط¯ط¯ ظ„ظ‡ ظ†ط³ط¨ط© ط®طµظ… ظ„ظٹط¨ط¯ط£ ط¨ط±ط¤ظٹط© ط³ط¹ط± ط§ظ„ط¬ظ…ظ„ط©."
                    />
                  }
                />
              )}
            </Box>

          </Paper>
        ) : null}

        {activeTab === "orders" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط§ظ„ط·ظ„ط¨ط§طھ"
              description="طھط§ط¨ط¹ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨ط§طھ ظˆط؛ظٹظ‘ط±ظ‡ط§ ط¨ط§ط³ظ… ظˆط§ط¶ط­ ط¨ط¯ظ„ ط§ظ„ط£ط±ظ‚ط§ظ…."
              onRefresh={ordersQuery.refetch}
              isRefreshing={ordersQuery.isFetching}
            />

            {ordersQuery.isLoading ? (
              <LoadingState />
            ) : orders.length ? (
              <Box className="owner-orders-grid">
                {orders.map((row) => {
                  const statusLabel =
                    row.statusText || row.statusLabel || "ط؛ظٹط± ظ…ط­ط¯ط¯ط©";
                  const customerName =
                    row.customerName || row.customerEmail || "ط¹ظ…ظٹظ„ ط§ظ„ظ…طھط¬ط±";
                  const customerId = row.customerId || row.storeCustomerId || "";
                  const statusTone =
                    Number(row.status) === 4
                      ? "success"
                      : Number(row.status) === 5 || Number(row.status) === 6
                        ? "error"
                        : Number(row.status) >= 1
                          ? "primary"
                          : "default";

                  return (
                    <Box key={row.id} className="owner-order-card">
                      <Box className="owner-order-card__head">
                        <Box className="owner-order-card__title">
                          <Typography variant="caption" color="text.secondary">
                            ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨
                          </Typography>
                          <Typography
                            component={RouterLink}
                            to={"/owner/orders/" + row.id}
                            variant="h6"
                            className="owner-order-card__link"
                          >
                            {row.orderNumber || row.id || "-"}
                          </Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={statusLabel}
                          color={statusTone}
                          variant={statusTone === "default" ? "outlined" : "filled"}
                        />
                      </Box>

                      <Box className="owner-order-card__meta">
                        <Box className="owner-order-card__meta-item">
                          <Typography variant="caption" color="text.secondary">
                            ط§ظ„ط¹ظ…ظٹظ„
                          </Typography>
                          {customerId ? (
                            <Typography
                              component={RouterLink}
                              to={"/owner/customers/" + customerId}
                              variant="body1"
                              className="owner-order-card__link"
                            >
                              {customerName}
                            </Typography>
                          ) : (
                            <Typography variant="body1">{customerName}</Typography>
                          )}
                          {row.customerPhone ? (
                            <Typography variant="caption" color="text.secondary">
                              {row.customerPhone}
                            </Typography>
                          ) : null}
                        </Box>

                        <Box className="owner-order-card__meta-item">
                          <Typography variant="caption" color="text.secondary">
                            طھط§ط±ظٹط® ط§ظ„ط·ظ„ط¨
                          </Typography>
                          <Typography variant="body1">
                            {row.createdAtLabel || "-"}
                          </Typography>
                          {row.title ? (
                            <Typography variant="caption" color="text.secondary">
                              {row.title}
                            </Typography>
                          ) : null}
                        </Box>
                      </Box>

                      <Box className="owner-order-card__summary">
                        <Box className="owner-order-card__summary-item">
                          <span>ط§ظ„ظ…ط­طھظˆظ‰</span>
                          <strong>{row.itemsCount ?? 0} ظ‚ط·ط¹ط©</strong>
                        </Box>
                        <Box className="owner-order-card__summary-item">
                          <span>ط§ظ„ط®طµظ…</span>
                          <strong>{formatCurrency(row.discount)}</strong>
                        </Box>
                        <Box className="owner-order-card__summary-item">
                          <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</span>
                          <strong>{formatCurrency(row.totalAmount)}</strong>
                        </Box>
                      </Box>

                      <Box className="owner-order-card__actions">
                        <TextField
                          select
                          size="small"
                          value={String(row.status ?? 0)}
                          onChange={(event) =>
                            updateOrderStatusMutation.mutate({
                              orderId: row.id,
                              payload: { status: Number(event.target.value) },
                            })
                          }
                          sx={{ minWidth: 190 }}
                        >
                          {ORDER_STATUS_OPTIONS.map((option) => (
                            <MenuItem
                              key={option.value}
                              value={String(option.value)}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <AppButton
                            component={RouterLink}
                            to={"/owner/orders/" + row.id}
                            size="small"
                            variant="outlined"
                          >
                            طھظپط§طµظٹظ„ ط§ظ„ط·ظ„ط¨
                          </AppButton>
                          {customerId ? (
                            <AppButton
                              component={RouterLink}
                              to={"/owner/customers/" + customerId}
                              size="small"
                              variant="text"
                            >
                              ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¹ظ…ظٹظ„
                            </AppButton>
                          ) : null}
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <EmptyState
                title="ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ"
                description="ط³طھط¸ظ‡ط± ظ‡ظ†ط§ ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط© ط§ظ„ظ‚ط§ط¯ظ…ط© ظ…ظ† ط§ظ„ظ…طھط¬ط±."
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "reviews" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="ط§ظ„طھظ‚ظٹظٹظ…ط§طھ"
              description="ط§ط¹طھظ…ط¯ ط§ظ„طھظ‚ظٹظٹظ…ط§طھ ط§ظ„ظ…ظ†ط§ط³ط¨ط© ط£ظˆ ط§ط±ظپط¶ظ‡ط§ ط¨ط³ط±ط¹ط©."
              onRefresh={reviewsQuery.refetch}
              isRefreshing={reviewsQuery.isFetching}
            />

            {reviewsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={reviews}
                columns={[
                  { key: "productName", title: "ط§ظ„ظ…ظ†طھط¬" },
                  { key: "rating", title: "ط§ظ„طھظ‚ظٹظٹظ…" },
                  { key: "comment", title: "ط§ظ„طھط¹ظ„ظٹظ‚" },
                  {
                    key: "isApproved",
                    title: "ط§ظ„ط­ط§ظ„ط©",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isApproved ? "ظ…ط¹طھظ…ط¯" : "ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯"}
                        color={row.isApproved ? "primary" : "default"}
                        variant={row.isApproved ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "ط¥ط¬ط±ط§ط،ط§طھ",
                    render: (row) => (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            updateReviewApprovalMutation.mutate({
                              reviewId: row.id,
                              payload: { isApproved: true },
                            })
                          }
                        >
                          ط§ط¹طھظ…ط§ط¯
                        </AppButton>
                        <AppButton
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() =>
                            updateReviewApprovalMutation.mutate({
                              reviewId: row.id,
                              payload: { isApproved: false },
                            })
                          }
                        >
                          ط±ظپط¶
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="ظ„ط§ طھظˆط¬ط¯ طھظ‚ظٹظٹظ…ط§طھ"
                    description="ط¹ظ†ط¯ ظˆطµظˆظ„ طھظ‚ظٹظٹظ… ط¬ط¯ظٹط¯ ظ…ظ† ط§ظ„ط¹ظ…ظ„ط§ط، ط³ظٹط¸ظ‡ط± ظ‡ظ†ط§."
                  />
                }
              />
            )}
          </Paper>
        ) : null}
      </Box>
    </DashboardLayout>
  );
}
