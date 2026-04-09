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
import PlanBadge from "../../components/dashboard/PlanBadge.jsx";
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
import useDeleteCategory from "../../hooks/categories/useDeleteCategory.js";
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
import useDeleteSection from "../../hooks/sections/useDeleteSection.js";
import useSections from "../../hooks/sections/useSections.js";
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
import { formatCurrency } from "../../utils/formatCurrency.js";
import { isOwnerRole } from "../../utils/roles.js";
import "./OwnerDashboard.css";

const TAB_CONFIG = [
  {
    key: "overview",
    label: "نظرة عامة",
    route: "/owner",
    description: "ملخص المتجر السريع",
    icon: <StorefrontRoundedIcon fontSize="small" />,
  },
  {
    key: "products",
    label: "المنتجات",
    route: "/owner/products",
    description: "إضافة وتعديل ونشر المنتجات",
    icon: <Inventory2RoundedIcon fontSize="small" />,
  },
  {
    key: "subscription",
    label: "اشتراك المتجر",
    route: "/owner/subscription",
    description: "إدارة الباقة وحدود الاستخدام",
    icon: <WorkspacePremiumRoundedIcon fontSize="small" />,
  },
  {
    key: "categories",
    label: "التصنيفات",
    route: "/owner/categories",
    description: "بناء شجرة الكاتيجوريز",
    icon: <CategoryRoundedIcon fontSize="small" />,
  },
  {
    key: "sections",
    label: "الأقسام",
    route: "/owner/sections",
    description: "تنظيم عرض المنتجات في الواجهة",
    icon: <LayersRoundedIcon fontSize="small" />,
  },
  {
    key: "orders",
    label: "الطلبات",
    route: "/owner/orders",
    description: "متابعة الحالة والتجهيز",
    icon: <LocalMallRoundedIcon fontSize="small" />,
  },
  {
    key: "coupons",
    label: "الكوبونات",
    route: "/owner/coupons",
    description: "بناء العروض السريعة",
    icon: <ConfirmationNumberRoundedIcon fontSize="small" />,
  },
  {
    key: "customers",
    label: "زبائن المتجر",
    route: "/owner/customers",
    description: "تحديد من يشاهد سعر الجملة داخل المتجر",
    icon: <PeopleAltRoundedIcon fontSize="small" />,
  },
  {
    key: "reviews",
    label: "التقييمات",
    route: "/owner/reviews",
    description: "اعتماد أو رفض المراجعات",
    icon: <RateReviewRoundedIcon fontSize="small" />,
  },
];

const ORDER_STATUS_OPTIONS = [
  { value: 0, label: "قيد الانتظار" },
  { value: 1, label: "تم التأكيد" },
  { value: 2, label: "قيد التجهيز" },
  { value: 3, label: "تم الشحن" },
  { value: 4, label: "تم التسليم" },
  { value: 5, label: "ملغي" },
  { value: 6, label: "مسترجع" },
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
    "تعذر تنفيذ العملية. حاول مرة أخرى."
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

function normalizePlanKey(value) {
  const normalized = normalizeText(value);

  if (!normalized) return "";
  if (["free", "basic", "starter", "0"].includes(normalized)) return "free";
  if (["standard", "pro-1", "business", "1"].includes(normalized))
    return "standard";
  if (["pro", "premium", "enterprise", "2"].includes(normalized)) return "pro";

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
    shortDescription: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "",
    categoryId: defaultCategoryId,
    sectionId: defaultSectionId,
    trackInventory: true,
    isFeatured: false,
    status: "1",
    publishNow: true,
    newImages: [],
    existingImages: [],
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
    normalizedData.subscription || normalizedData.currentSubscription || {};

  const currentPlan =
    normalizePlanKey(
      firstDefined(
        fromNested.plan,
        fromNested.planName,
        fromNested.tier,
        normalizedData.plan,
        normalizedData.planName,
        normalizedData.subscriptionPlan,
        normalizedData.tier,
        store?.plan,
        store?.planName,
        store?.subscriptionPlan,
      ),
    ) || "free";

  return {
    currentPlan,
    startedAt: firstDefined(
      fromNested.startedAt,
      normalizedData.startedAt,
      normalizedData.subscriptionStartDate,
    ),
    renewalAt: firstDefined(
      fromNested.renewalAt,
      normalizedData.renewalAt,
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
      "عميل المتجر",
    ),
    name: customer.name || "مستخدم",
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
      ?.label || "غير محددة"
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
  return {
    ...item,
    orderNumber: firstDefined(item?.orderNumber, item?.id, "-"),
    statusLabel: getOrderStatusLabel(item?.status),
    createdAtLabel: formatDateTimeLabel(item?.createdAt),
    totalAmount: toNumber(item?.totalAmount, 0),
    itemsCount: toNumber(item?.itemsCount, 0),
  };
}

function normalizeReviewItem(item) {
  return {
    ...item,
    storeCustomerFullName: firstDefined(
      item?.storeCustomerFullName,
      "عميل المتجر",
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
        label: `${"— ".repeat(depth)}${item.name}${item.isActive ? "" : " (غير نشط)"}`,
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
      return "مسودة";
    case 1:
      return "نشط";
    case 2:
      return "مؤرشف";
    case 3:
      return "نفد مخزونه";
    default:
      return "غير محدد";
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
        تحديث
      </AppButton>
    </Box>
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
  const { isAuthenticated, role } = useAuth();
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

  const isOverviewTab = activeTab === "overview";
  const shouldLoadProducts = isOverviewTab || activeTab === "products";
  const shouldLoadCategories =
    isOverviewTab || activeTab === "categories" || activeTab === "products";
  const shouldLoadSections =
    isOverviewTab || activeTab === "sections" || activeTab === "products";
  const shouldLoadCoupons = isOverviewTab || activeTab === "coupons";
  const shouldLoadCustomerStores = isOverviewTab || activeTab === "customers";
  const shouldLoadOrders = isOverviewTab || activeTab === "orders";
  const shouldLoadReviews = isOverviewTab || activeTab === "reviews";
  const shouldLoadSubscription = activeTab === "subscription";

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
  const deleteCategoryMutation = useDeleteCategory(storeId);

  const createSectionMutation = useCreateSection(storeId);
  const updateSectionMutation = useUpdateSection(storeId);
  const deleteSectionMutation = useDeleteSection(storeId);

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
      setSubscriptionSuccessMessage("تم تحديث باقة المتجر بنجاح.");
    },
  });

  const productsRaw = normalizeListResponse(productsQuery.data);
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
          "slug",
          "shortDescription",
          "description",
          "categoryName",
          "sectionName",
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
  const customers = useMemo(
    () =>
      storeCustomersAll.filter((item) =>
        matchesText(item, deferredSearchText, ["fullName", "email", "phone"]),
      ),
    [deferredSearchText, storeCustomersAll],
  );
  const availableCustomers = [];
  const availableCustomersQuery = {
    isLoading: false,
    error: null,
    isFetching: false,
    refetch: () => {},
  };
  const ordersAll = useMemo(
    () => ordersRaw.map((item) => normalizeOrderSummary(item)),
    [ordersRaw],
  );
  const orders = useMemo(
    () =>
      ordersAll.filter((item) =>
        matchesText(item, deferredSearchText, [
          "orderNumber",
          "statusLabel",
          "createdAtLabel",
        ]),
      ),
    [deferredSearchText, ordersAll],
  );
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
      label: "المنتجات المنشورة",
      value: productsRaw.length,
      help: "المنتجات الظاهرة حاليًا في المتجر",
      icon: <SellRoundedIcon fontSize="small" />,
      tone: "warm",
    },
    {
      label: "الطلبات المفتوحة",
      value: pendingOrdersCount,
      help: "طلبات تحتاج متابعة أو تأكيد",
      icon: <LocalMallRoundedIcon fontSize="small" />,
      tone: "cool",
    },
    {
      label: "التصنيفات",
      value: categoriesRaw.length,
      help: "شجرة الكاتيجوريز الحالية",
      icon: <CategoryRoundedIcon fontSize="small" />,
      tone: "neutral",
    },
    {
      label: "المراجعات المعلقة",
      value: pendingReviewsCount,
      help: "تقييمات بانتظار الاعتماد",
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
    deleteCategoryMutation.error,
    createSectionMutation.error,
    updateSectionMutation.error,
    deleteSectionMutation.error,
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

  const resetProductForm = () =>
    setProductForm(buildProductForm(defaultCategoryId, defaultSectionId));
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
    shortDescription: product?.shortDescription || "",
    description: product?.description || "",
    price: String(product?.originalPrice ?? product?.price ?? ""),
    compareAtPrice: String(product?.compareAtPrice ?? ""),
    stockQuantity: String(product?.stockQuantity ?? 0),
    categoryId: product?.categoryId || defaultCategoryId,
    sectionId: product?.sectionId || defaultSectionId,
    trackInventory: Boolean(product?.trackInventory),
    isFeatured: Boolean(product?.isFeatured),
    status: String(product?.status ?? 1),
    publishNow: true,
    newImages: [],
    existingImages: Array.isArray(product?.images) ? product.images : [],
  });

  const handleOpenProductEditor = async (row) => {
    if (!row?.id || editingProductId) return;

    setEditingProductId(row.id);

    try {
      const product = normalizeEntityResponse(
        await productApi.getProductById(row.id),
      );

      setProductForm(buildEditProductForm(product || row));
    } catch {
      setProductForm(buildEditProductForm(row));
    } finally {
      setEditingProductId("");
    }
  };

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!isOwnerRole(role)) return <Navigate to="/market" replace />;

  if (ownerStoreQuery.isLoading) {
    return <LoadingState label="جارٍ تحميل بيانات المتجر..." />;
  }

  if (!store) {
    return (
      <EmptyState
        title="لا يوجد متجر مرتبط بهذا الحساب"
        description="تأكد من وجود متجر مرتبط بصاحب الحساب أو تواصل مع الإدارة."
        action={
          <AppButton component={RouterLink} to="/market" variant="contained">
            العودة إلى السوق
          </AppButton>
        }
      />
    );
  }

  const selectedCategory = categoryLookup.get(productForm.categoryId);
  const categoryHint = selectedCategory?.isLeaf
    ? `المنتج سيرتبط بالتصنيف: ${selectedCategory.pathLabel}`
    : selectedCategory
      ? `يفضل ربط المنتج بآخر مستوى داخل: ${selectedCategory.pathLabel}`
      : "";

  const confirmDelete = (label, mutation, variables) => {
    if (!window.confirm(`هل تريد حذف ${label}؟`)) return;
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
    if (!window.confirm("هل تريد حذف هذه الصورة من المنتج؟")) return;

    try {
      await deleteProductImageMutation.mutateAsync({
        imageId: image.id,
        productId: productForm.id,
      });

      setProductForm((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter(
          (item) => item.id !== image.id,
        ),
      }));
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();

    if (!storeId) return;
    if (!categoriesRaw.length || !sectionsRaw.length) return;

    const payload = {
      Name: productForm.name.trim(),
      Slug: slugify(productForm.slug || productForm.name),
      ShortDescription: productForm.shortDescription || undefined,
      Description: productForm.description || undefined,
      Price: Number(productForm.price),
      CompareAtPrice: productForm.compareAtPrice
        ? Number(productForm.compareAtPrice)
        : undefined,
      StockQuantity: Number(productForm.stockQuantity),
      TrackInventory: Boolean(productForm.trackInventory),
      CategoryId: productForm.categoryId || defaultCategoryId,
      SectionId: productForm.sectionId || defaultSectionId,
      StoreId: storeId,
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
            StockQuantity: payload.StockQuantity,
            TrackInventory: payload.TrackInventory,
            CategoryId: payload.CategoryId,
            SectionId: payload.SectionId,
            Status: Number(productForm.status),
            IsFeatured: Boolean(productForm.isFeatured),
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

      const createdProductEntity =
        normalizeEntityResponse(createdProduct) || createdProduct;
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
      title: "العميل",
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
      title: "الهاتف",
      render: (row) => row.phone || "-",
    },
    {
      key: "discountPercentage",
      title: "خصم الجملة",
      render: (row) => formatDiscountPercentage(row.discountPercentage),
    },
    {
      key: "isActive",
      title: "الحالة",
      render: (row) => (
        <Chip
          size="small"
          label={row.isActive ? "مفعل" : "متوقف"}
          color={row.isActive ? "primary" : "default"}
          variant={row.isActive ? "filled" : "outlined"}
        />
      ),
    },
    {
      key: "actions",
      title: "إجراءات",
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <AppButton
            size="small"
            variant="outlined"
            onClick={() => openCustomerStoreEditor(row)}
          >
            تعديل
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
                `العميل ${row.fullName}`,
                deleteCustomerStoreMutation,
                row.id,
              )
            }
          >
            حذف
          </AppButton>
        </Stack>
      ),
    },
  ];
  const orderColumns = [
    { key: "orderNumber", title: "رقم الطلب" },
    {
      key: "itemsCount",
      title: "العناصر",
      render: (row) => row.itemsCount ?? 0,
    },
    {
      key: "totalAmount",
      title: "الإجمالي",
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: "statusLabel",
      title: "الحالة الحالية",
      render: (row) => row.statusLabel || "غير محددة",
    },
    {
      key: "createdAtLabel",
      title: "تاريخ الإنشاء",
      render: (row) => row.createdAtLabel,
    },
    {
      key: "actions",
      title: "تحديث الحالة",
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
      title: "العميل",
      render: (row) => row.storeCustomerFullName || "عميل المتجر",
    },
    {
      key: "productId",
      title: "معرف المنتج",
      render: (row) => row.productId,
    },
    { key: "rating", title: "التقييم" },
    { key: "comment", title: "التعليق" },
    {
      key: "isApproved",
      title: "الحالة",
      render: (row) => (
        <Chip
          size="small"
          label={row.isApproved ? "معتمد" : "بانتظار الاعتماد"}
          color={row.isApproved ? "primary" : "default"}
          variant={row.isApproved ? "filled" : "outlined"}
        />
      ),
    },
    {
      key: "actions",
      title: "إجراءات",
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
            اعتماد
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
            رفض
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
              aria-label="فتح إدارة المتجر"
            >
              <span className="owner-mobile-launcher__icon" aria-hidden>
                <AdminPanelSettingsRoundedIcon fontSize="small" />
              </span>
              <span className="owner-mobile-launcher__text">إدارة المتجر</span>
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
                    إدارة المتجر
                  </Typography>
                  <Typography variant="h6">
                    {store?.name || "متجرك"}
                  </Typography>
                </Box>

                <IconButton
                  aria-label="إغلاق القائمة الإدارية"
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
            <PlanBadge planKey={subscription.currentPlan} />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <AppButton
                component={RouterLink}
                to="/owner/subscription"
                variant={
                  activeTab === "subscription" ? "contained" : "outlined"
                }
                startIcon={<WorkspacePremiumRoundedIcon fontSize="small" />}
              >
                الباقات
              </AppButton>

              <ContactDeveloperButton
                label="تواصل مع المطور"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper className="owner-hero" elevation={0}>
          <Box className="owner-hero__copy">
            <Typography variant="overline" className="owner-hero__eyebrow">
              متجر مرتب، إدارة أسرع
            </Typography>
            <Typography variant="h3" className="owner-hero__title">
              كل ما تحتاجه لإدارة متجرك في شاشة واحدة
            </Typography>
            <Typography variant="body1" className="owner-hero__desc">
              رتّب المنتجات، تابع الطلبات، ونسّق التصنيفات والعروض من مساحة أوضح
              تساعدك على العمل بسرعة وراحة.
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<VisibilityRoundedIcon fontSize="small" />}
                label={`${store.visitCount ?? 0} زيارة`}
              />
              <Chip
                label={`${productsRaw.length} منتج منشور`}
                variant="outlined"
              />
              <Chip label={`${sectionsRaw.length} قسم`} variant="outlined" />
            </Stack>
          </Box>

          <Box className="owner-hero__actions">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="ابحث داخل التبويب الحالي..."
            />

            <Stack direction="row" spacing={1}>
              <AppButton
                component={RouterLink}
                to={store.slug ? `/market/${store.slug}` : "/market"}
                variant="outlined"
              >
                عرض المتجر كزائر
              </AppButton>
              <AppButton
                component={RouterLink}
                to="/market"
                variant="contained"
              >
                السوق
              </AppButton>
            </Stack>
          </Box>
        </Paper>

        {mutationError ? (
          <Alert severity="error">{getErrorMessage(mutationError)}</Alert>
        ) : null}

        {activeTab === "overview" ? (
          <>
            <Paper className="owner-store-banner" elevation={0}>
              <Box className="owner-store-banner__content">
                <Box>
                  <Typography variant="h5">{store.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {store.description || "لم يتم إضافة وصف للمتجر بعد."}
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
                    label={store.isActive ? "المتجر نشط" : "المتجر غير نشط"}
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
              title="اشتراك المتجر"
              description="اختر الباقة الأنسب لمرحلة نمو متجرك، ويمكنك التبديل في أي وقت."
              onRefresh={subscriptionQuery.refetch}
              isRefreshing={subscriptionQuery.isFetching}
            />

            {subscriptionSuccessMessage ? (
              <Alert severity="success">{subscriptionSuccessMessage}</Alert>
            ) : null}

            {subscriptionQuery.error ? (
              <Alert severity="warning">
                {getErrorMessage(subscriptionQuery.error)}
              </Alert>
            ) : null}

            {subscriptionQuery.isLoading ? (
              <LoadingState label="جارٍ تحميل معلومات الاشتراك..." />
            ) : (
              <>
                <Alert severity="info" className="owner-inline-alert">
                  الباقة النشطة حاليًا: {activePlan.label}
                  {subscription.renewalAt
                    ? ` • تاريخ التجديد: ${formatDateTimeLabel(subscription.renewalAt)}`
                    : ""}
                </Alert>

                <Box
                  className="owner-subscription-grid"
                  role="radiogroup"
                  aria-label="خيارات باقات الاشتراك"
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
                              label="الباقة الحالية"
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
                          aria-label={`تغيير الباقة إلى ${plan.label}`}
                        >
                          {isActivePlan
                            ? "الباقة الحالية"
                            : "تغيير إلى هذه الباقة"}
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
                        الباقة المحددة:{" "}
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
                        تأكيد تغيير الباقة
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
              title="إدارة المنتجات"
              description="إضافة منتجات أو تعديلها مع دعم صور متعددة ونشر مباشر."
              onRefresh={productsQuery.refetch}
              isRefreshing={productsQuery.isFetching}
            />

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

            <Divider />

            {productsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={products}
                columns={[
                  {
                    key: "name",
                    title: "المنتج",
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
                    title: "التصنيف",
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
                    title: "السعر",
                    render: (row) => (
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(row.price)}
                        </Typography>
                        {row.compareAtPrice ? (
                          <Typography variant="caption" color="text.secondary">
                            قبل الخصم: {formatCurrency(row.compareAtPrice)}
                          </Typography>
                        ) : null}
                      </Stack>
                    ),
                  },
                  {
                    key: "status",
                    title: "الحالة",
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
                          {row.images?.length ?? 0} صورة
                        </Typography>
                      </Stack>
                    ),
                  },
                  { key: "stockQuantity", title: "المخزون" },
                  {
                    key: "actions",
                    title: "إجراءات",
                    render: (row) => (
                      <Stack direction="row" spacing={1}>
                        <AppButton
                          size="small"
                          variant="outlined"
                          loading={editingProductId === row.id}
                          onClick={() => handleOpenProductEditor(row)}
                        >
                          تعديل
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
                              `المنتج ${row.name}`,
                              deleteProductMutation,
                              row.id,
                            )
                          }
                        >
                          حذف
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="لا توجد منتجات منشورة"
                    description="ابدأ بإضافة أول منتج، وسيتم نشره مباشرة إذا أبقيت خيار النشر المباشر مفعّلًا."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "categories" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="إدارة التصنيفات"
              description="إنشاء تصنيفات رئيسية وفرعية بشكل هرمي وواضح."
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
                    title: "التصنيف",
                    render: (row) => (
                      <Stack spacing={0.3}>
                        <Typography variant="body2" fontWeight={700}>
                          {row.pathLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          المستوى: {row.depth + 1}
                        </Typography>
                      </Stack>
                    ),
                  },
                  { key: "slug", title: "الرابط" },
                  {
                    key: "parentCategoryName",
                    title: "الأب",
                    render: (row) => row.parentCategoryName || "رئيسي",
                  },
                  {
                    key: "isActive",
                    title: "الحالة",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isActive ? "نشط" : "غير نشط"}
                        color={row.isActive ? "primary" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "إجراءات",
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
                          تعديل
                        </AppButton>
                        <AppButton
                          size="small"
                          variant="outlined"
                          color="error"
                          loading={
                            deleteCategoryMutation.isPending &&
                            deleteCategoryMutation.variables === row.id
                          }
                          onClick={() =>
                            confirmDelete(
                              `التصنيف ${row.name}`,
                              deleteCategoryMutation,
                              row.id,
                            )
                          }
                        >
                          حذف
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="لا توجد تصنيفات"
                    description="أنشئ تصنيفًا رئيسيًا أو فرعيًا لتنظيم منتجات المتجر."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "sections" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="إدارة الأقسام"
              description="الأقسام تساعد في توزيع المنتجات على واجهة المتجر بشكل أوضح."
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
                  { key: "name", title: "القسم" },
                  { key: "slug", title: "الرابط" },
                  { key: "displayOrder", title: "الترتيب" },
                  {
                    key: "isActive",
                    title: "الحالة",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isActive ? "نشط" : "غير نشط"}
                        color={row.isActive ? "primary" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "إجراءات",
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
                          تعديل
                        </AppButton>
                        <AppButton
                          size="small"
                          variant="outlined"
                          color="error"
                          loading={
                            deleteSectionMutation.isPending &&
                            deleteSectionMutation.variables === row.id
                          }
                          onClick={() =>
                            confirmDelete(
                              `القسم ${row.name}`,
                              deleteSectionMutation,
                              row.id,
                            )
                          }
                        >
                          حذف
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="لا توجد أقسام"
                    description="أضف قسمًا واحدًا على الأقل حتى تتمكن من توزيع المنتجات داخل الواجهة."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "coupons" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="إدارة الكوبونات"
              description="أنشئ عروضًا سريعة وواضحة يمكن تفعيلها أو تعطيلها مباشرة."
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
                  { key: "code", title: "الكود" },
                  {
                    key: "discountValue",
                    title: "الخصم",
                    render: (row) =>
                      Number(row.discountType) === 0
                        ? `${row.discountValue}%`
                        : formatCurrency(row.discountValue),
                  },
                  {
                    key: "discountType",
                    title: "النوع",
                    render: (row) =>
                      Number(row.discountType) === 0
                        ? "نسبة مئوية"
                        : "قيمة ثابتة",
                  },
                  {
                    key: "isActive",
                    title: "الحالة",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isActive ? "نشط" : "غير نشط"}
                        color={row.isActive ? "primary" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "إجراءات",
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
                          تعديل
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
                              `الكوبون ${row.code}`,
                              deleteCouponMutation,
                              row.id,
                            )
                          }
                        >
                          حذف
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="لا توجد كوبونات"
                    description="أضف أول كوبون لتسهيل العروض والتحفيز على الشراء."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "customers" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="زبائن المتجر وسعر الجملة"
              description="اختر من المستخدمين المسجلين من يحصل على تسعير خاص داخل متجرك، ثم عدل نسبة الخصم أو أوقفها متى احتجت."
              onRefresh={() => {
                storeCustomersQuery.refetch();
              }}
              isRefreshing={storeCustomersQuery.isFetching}
            />

            <Alert severity="info" className="owner-inline-alert">
              خصم زبون المتجر لا يؤثر على شاشة الإدارة فقط، بل يغيّر السعر
              الظاهر للعميل بعد تسجيل الدخول ويُثبت داخل السلة ثم ينتقل إلى
              الطلب.
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
                اختر عميلًا من الجدول بالأسفل لتعديل الخصم أو حالة الحساب. إنشاء
                عميل جديد لم يعد جزءًا من هذه الشاشة.
              </Alert>
            )}

            <Divider />

            <Box className="owner-subsection">
              <Box>
                <Typography variant="h6" className="owner-subsection__title">
                  زبائن المتجر الحاليون
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  هؤلاء هم المستخدمون الذين يشاهدون تسعيرًا خاصًا داخل هذا
                  المتجر.
                </Typography>
              </Box>

              {storeCustomersQuery.isLoading ? (
                <LoadingState />
              ) : storeCustomersQuery.error ? (
                <Alert severity="error">
                  {getErrorMessage(storeCustomersQuery.error)}
                </Alert>
              ) : (
                <AppDataTable
                  rows={customers}
                  columns={[
                    {
                      key: "name",
                      title: "العميل",
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
                      title: "خصم الجملة",
                      render: (row) =>
                        formatDiscountPercentage(row.discountPercentage),
                    },
                    {
                      key: "isActive",
                      title: "الحالة",
                      render: (row) => (
                        <Chip
                          size="small"
                          label={row.isActive ? "مفعل" : "متوقف"}
                          color={row.isActive ? "primary" : "default"}
                          variant={row.isActive ? "filled" : "outlined"}
                        />
                      ),
                    },
                    {
                      key: "actions",
                      title: "إجراءات",
                      render: (row) => (
                        <Stack direction="row" spacing={1}>
                          <AppButton
                            size="small"
                            variant="outlined"
                            onClick={() => openCustomerStoreEditor(row)}
                          >
                            تعديل
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
                                `العميل ${row.fullName}`,
                                deleteCustomerStoreMutation,
                                row.id,
                              )
                            }
                          >
                            حذف
                          </AppButton>
                        </Stack>
                      ),
                    },
                  ]}
                  emptyState={
                    <EmptyState
                      title="لا يوجد زبائن متجر بعد"
                      description="اختر مستخدمًا مسجلًا من القائمة بالأسفل وحدد له نسبة خصم ليبدأ برؤية سعر الجملة."
                    />
                  }
                />
              )}
            </Box>

            <Divider />

            <Box className="owner-subsection">
              <Box>
                <Typography variant="h6" className="owner-subsection__title">
                  المستخدمون المتاحون للإضافة
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  اختر أي مستخدم مسجل ليصبح من زبائن المتجر ويشاهد السعر الخاص
                  بعد تسجيل الدخول.
                </Typography>
              </Box>

              {availableCustomersQuery.isLoading ? (
                <LoadingState />
              ) : availableCustomersQuery.error ? (
                <Alert severity="warning">
                  {getErrorMessage(availableCustomersQuery.error)}
                </Alert>
              ) : (
                <AppDataTable
                  rows={availableCustomers}
                  columns={[
                    {
                      key: "name",
                      title: "المستخدم",
                      render: (row) => (
                        <Stack spacing={0.3}>
                          <Typography variant="body2" fontWeight={700}>
                            {row.name || "مستخدم مسجل"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.email || row.id}
                          </Typography>
                        </Stack>
                      ),
                    },
                    {
                      key: "id",
                      title: "المعرف",
                      render: (row) => (
                        <Typography variant="caption" color="text.secondary">
                          {row.id}
                        </Typography>
                      ),
                    },
                    {
                      key: "actions",
                      title: "إجراء",
                      render: (row) => (
                        <AppButton
                          size="small"
                          variant="outlined"
                          onClick={() => handleSelectAvailableCustomer(row)}
                        >
                          تحديد خصم
                        </AppButton>
                      ),
                    },
                  ]}
                  emptyState={
                    <EmptyState
                      title="لا يوجد مستخدمون متاحون"
                      description="إما أن جميع المستخدمين أضيفوا بالفعل كزبائن للمتجر أو أن قائمة المستخدمين المسجلين فارغة."
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
              title="الطلبات"
              description="تابع حالة الطلبات وغيّرها باسم واضح بدل الأرقام."
              onRefresh={ordersQuery.refetch}
              isRefreshing={ordersQuery.isFetching}
            />

            {ordersQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={orders}
                columns={[
                  { key: "id", title: "رقم الطلب" },
                  {
                    key: "customerName",
                    title: "العميل",
                    render: (row) => row.customerName || "غير محدد",
                  },
                  {
                    key: "totalAmount",
                    title: "الإجمالي",
                    render: (row) => formatCurrency(row.totalAmount),
                  },
                  {
                    key: "status",
                    title: "الحالة الحالية",
                    render: (row) => row.statusText || "غير محددة",
                  },
                  {
                    key: "actions",
                    title: "تحديث الحالة",
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
                          <MenuItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="لا توجد طلبات"
                    description="ستظهر هنا الطلبات الجديدة القادمة من المتجر."
                  />
                }
              />
            )}
          </Paper>
        ) : null}

        {activeTab === "reviews" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="التقييمات"
              description="اعتمد التقييمات المناسبة أو ارفضها بسرعة."
              onRefresh={reviewsQuery.refetch}
              isRefreshing={reviewsQuery.isFetching}
            />

            {reviewsQuery.isLoading ? (
              <LoadingState />
            ) : (
              <AppDataTable
                rows={reviews}
                columns={[
                  { key: "productName", title: "المنتج" },
                  { key: "rating", title: "التقييم" },
                  { key: "comment", title: "التعليق" },
                  {
                    key: "isApproved",
                    title: "الحالة",
                    render: (row) => (
                      <Chip
                        size="small"
                        label={row.isApproved ? "معتمد" : "بانتظار الاعتماد"}
                        color={row.isApproved ? "primary" : "default"}
                        variant={row.isApproved ? "filled" : "outlined"}
                      />
                    ),
                  },
                  {
                    key: "actions",
                    title: "إجراءات",
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
                          اعتماد
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
                          رفض
                        </AppButton>
                      </Stack>
                    ),
                  },
                ]}
                emptyState={
                  <EmptyState
                    title="لا توجد تقييمات"
                    description="عند وصول تقييم جديد من العملاء سيظهر هنا."
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
