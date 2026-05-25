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
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
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
import useAddVariant from "../../hooks/products/useAddVariant.js";
import useCreateProduct from "../../hooks/products/useCreateProduct.js";
import useDeleteVariant from "../../hooks/products/useDeleteVariant.js";
import useDeleteProduct from "../../hooks/products/useDeleteProduct.js";
import useDeleteProductImage from "../../hooks/products/useDeleteProductImage.js";
import useProducts from "../../hooks/products/useProducts.js";
import useUpdateProduct from "../../hooks/products/useUpdateProduct.js";
import useUpdateVariant from "../../hooks/products/useUpdateVariant.js";
import useUploadProductImage from "../../hooks/products/useUploadProductImage.js";
import useCreateSection from "../../hooks/sections/useCreateSection.js";
import useSections from "../../hooks/sections/useSections.js";
import { OWNER_PREVIEW_SEARCH } from "../../hooks/stores/useOwnerStorePreview.js";
import useUpdateSection from "../../hooks/sections/useUpdateSection.js";
import useOwnerStore from "../../hooks/stores/useOwnerStore.js";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import { resolveAssetUrl } from "../../utils/assetUrl.js";
import { normalizeListResponse } from "../../utils/collections.js";
import {
  logAuthFlow,
  serializeAuthFlowStore,
  serializeAuthFlowUser,
} from "../../utils/authFlowDebug.js";
import extractApiError from "../../utils/extractApiError.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import {
  formatUiDateTime,
  formatUiNumber,
} from "../../utils/numberFormat.js";
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

function getApiErrorMessage(error) {
  return extractApiError(error, "تعذر تنفيذ العملية. حاول مرة أخرى.");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
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
    sku: "",
    shortDescription: "",
    description: "",
    price: "",
    wholesalePrice: "0",
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

const IMAGE_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const IMAGE_FILE_MAX_SIZE = 5 * 1024 * 1024;
const IMAGE_FILE_ERROR =
  "يجب أن تكون الصورة بصيغة JPG أو JPEG أو PNG أو WEBP، وبحجم لا يتجاوز 5MB.";

function isValidImageFile(file) {
  const fileName = String(file?.name || "").toLowerCase();
  const isValidExtension = IMAGE_FILE_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension),
  );

  return isValidExtension && Number(file?.size || 0) <= IMAGE_FILE_MAX_SIZE;
}

function getVariantFormKey(variant, index) {
  return String(variant?.id || variant?.localId || index);
}

function getVariantImages(variant) {
  return Array.isArray(variant?.images) ? variant.images : [];
}

function buildVariantDraft(sortOrder = 0) {
  return {
    localId: `variant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    sku: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "0",
    imageUrl: "",
    imageFile: null,
    images: [],
    effectiveImageUrl: "",
    sortOrder: String(sortOrder),
    attributeValueIds: [],
  };
}

function normalizeVariantFormValue(variant, index = 0) {
  return {
    id: variant?.id || variant?.Id || "",
    localId: variant?.localId || "",
    name: variant?.name || variant?.Name || "",
    sku: variant?.sku || variant?.SKU || "",
    description: variant?.description || variant?.Description || "",
    price:
      variant?.price !== undefined && variant?.price !== null
        ? String(variant.price)
        : variant?.Price !== undefined && variant?.Price !== null
          ? String(variant.Price)
          : "",
    compareAtPrice:
      variant?.compareAtPrice !== undefined && variant?.compareAtPrice !== null
        ? String(variant.compareAtPrice)
        : variant?.CompareAtPrice !== undefined && variant?.CompareAtPrice !== null
          ? String(variant.CompareAtPrice)
          : "",
    stockQuantity: String(variant?.stockQuantity ?? variant?.StockQuantity ?? 0),
    imageUrl: variant?.imageUrl || variant?.ImageUrl || "",
    effectiveImageUrl:
      variant?.effectiveImageUrl ||
      variant?.EffectiveImageUrl ||
      variant?.imageUrl ||
      variant?.ImageUrl ||
      "",
    imageFile: variant?.imageFile || null,
    images: Array.isArray(variant?.images)
      ? variant.images
      : Array.isArray(variant?.Images)
        ? variant.Images
        : [],
    sortOrder: String(variant?.sortOrder ?? variant?.SortOrder ?? index),
    attributeValueIds: Array.isArray(variant?.attributeValueIds)
      ? variant.attributeValueIds
      : Array.isArray(variant?.AttributeValueIds)
        ? variant.AttributeValueIds
        : Array.isArray(variant?.attributeValues)
          ? variant.attributeValues
              .map((item) => item?.attributeValueId || item?.AttributeValueId)
              .filter(Boolean)
          : Array.isArray(variant?.AttributeValues)
            ? variant.AttributeValues
                .map((item) => item?.attributeValueId || item?.AttributeValueId)
                .filter(Boolean)
            : [],
    isDefault: Boolean(variant?.isDefault ?? variant?.IsDefault),
    isActive: (variant?.isActive ?? variant?.IsActive) !== false,
  };
}

function isVariantDraftEmpty(variant) {
  const stockValue = String(variant?.stockQuantity ?? "").trim();

  return ![
    variant?.name,
    variant?.description,
    variant?.price,
    variant?.compareAtPrice,
    variant?.imageFile,
  ].some((value) => String(value ?? "").trim()) &&
    (!stockValue || stockValue === "0");
}

function buildVariantPayload(variant) {
  return {
    Name: String(variant?.name || "").trim(),
    SKU: String(variant?.sku || "").trim() || null,
    Description: String(variant?.description || "").trim() || null,
    Price:
      String(variant?.price ?? "").trim() !== ""
        ? Number(variant.price)
        : null,
    CompareAtPrice:
      String(variant?.compareAtPrice ?? "").trim() !== ""
        ? Number(variant.compareAtPrice)
        : null,
    StockQuantity: Number(variant?.stockQuantity || 0),
    ImageUrl: String(variant?.imageUrl || "").trim() || null,
    SortOrder:
      String(variant?.sortOrder ?? "").trim() !== ""
        ? Number(variant.sortOrder)
        : undefined,
    AttributeValueIds: Array.isArray(variant?.attributeValueIds)
      ? variant.attributeValueIds
      : [],
  };
}

function appendImageToVariant(variant, image) {
  if (!image) {
    return { ...variant, imageFile: null };
  }

  const nextImages = [...getVariantImages(variant), image];

  return {
    ...variant,
    imageFile: null,
    images: nextImages,
    effectiveImageUrl: variant.effectiveImageUrl || image.url || "",
  };
}

function findCreatedVariantForDraft(draft, createdVariants, usedVariantIds) {
  const candidates = createdVariants.filter(
    (variant) => variant?.id && !usedVariantIds.has(String(variant.id)),
  );
  const draftSku = String(draft?.sku || "").trim().toLowerCase();
  const draftName = String(draft?.name || "").trim().toLowerCase();
  const draftSortOrder = Number(draft?.sortOrder);

  return (
    (draftSku &&
      candidates.find(
        (variant) => String(variant?.sku || "").trim().toLowerCase() === draftSku,
      )) ||
    (draftName &&
      Number.isFinite(draftSortOrder) &&
      candidates.find(
        (variant) =>
          String(variant?.name || "").trim().toLowerCase() === draftName &&
          Number(variant?.sortOrder ?? 0) === draftSortOrder,
      )) ||
    (draftName &&
      candidates.find(
        (variant) => String(variant?.name || "").trim().toLowerCase() === draftName,
      )) ||
    (Number.isFinite(draftSortOrder) &&
      candidates.find(
        (variant) => Number(variant?.sortOrder ?? 0) === draftSortOrder,
      )) ||
    candidates[0] ||
    null
  );
}

function buildCategoryForm() {
  return {
    mode: "create",
    id: "",
    name: "",
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
  return `${formatUiNumber(
    toNumber(value, 0),
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
    0,
  )}%`;
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
  return formatUiDateTime(value);
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

function OrderDetailsDialog({ open, order, loading, error, onClose }) {
  const displayStatus =
    order?.statusText || order?.statusLabel || getOrderStatusLabel(order?.status);
  const createdAtLabel = order?.createdAtLabel || formatDateTimeLabel(order?.createdAt);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>تفاصيل الطلب</DialogTitle>

      <DialogContent dividers>
        {loading && !order ? <LoadingState label="جارٍ تحميل تفاصيل الطلب..." /> : null}

        {!loading && error && !order ? (
          <Alert severity="error">{getApiErrorMessage(error)}</Alert>
        ) : null}

        {order ? (
          <Box className="owner-order-dialog">
            {error ? (
              <Alert severity="warning">
                تعذر تحميل أحدث نسخة من الطلب، لذلك يتم عرض البيانات المتوفرة حاليًا.
              </Alert>
            ) : null}

            <Box className="owner-order-dialog__grid">
              <Box className="owner-order-dialog__meta">
                <span>رقم الطلب</span>
                <strong>{order.orderNumber || order.id || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>العميل</span>
                <strong>
                  {order.customerName || "Customer not found"} ({order.customerId || order.storeCustomerId || "-"})
                </strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>تاريخ الإنشاء</span>
                <strong>{createdAtLabel}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>الحالة</span>
                <strong>{displayStatus || "غير محددة"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>العنوان</span>
                <strong>{order.deliveryAddress || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>المدينة</span>
                <strong>{order.deliveryCity || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>الهاتف</span>
                <strong>{order.deliveryPhone || "-"}</strong>
              </Box>
              <Box className="owner-order-dialog__meta">
                <span>الكوبون</span>
                <strong>{order.couponCode || "-"}</strong>
              </Box>
            </Box>

            {order.customerNotes ? (
              <Box className="owner-order-dialog__note">
                <Typography variant="subtitle2">ملاحظات العميل</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.customerNotes}
                </Typography>
              </Box>
            ) : null}

            <Box className="owner-order-dialog__items">
              <Box className="owner-order-dialog__items-head">
                <Typography variant="h6">محتويات الطلب</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.itemsCount ?? 0} قطعة
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
                            {item.productName || `منتج ${index + 1}`}
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
                        <span>الكمية: {item.quantity}</span>
                        <span>سعر الوحدة: {formatCurrency(item.unitPrice)}</span>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Alert severity="info">
                  لا توجد تفاصيل منتجات مرفقة بهذا الطلب من الـ API الحالي.
                </Alert>
              )}
            </Box>

            <Box className="owner-order-dialog__summary">
              <Box className="owner-order-dialog__summary-row">
                <span>السعر الأصلي</span>
                <strong>{formatCurrency(order.subtotal)}</strong>
              </Box>
              <Box className="owner-order-dialog__summary-row">
                <span>الخصم</span>
                <strong>{formatCurrency(order.discount)}</strong>
              </Box>
              <Box className="owner-order-dialog__summary-row owner-order-dialog__summary-row--total">
                <span>الإجمالي النهائي</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions>
        <AppButton variant="outlined" onClick={onClose}>
          إغلاق
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
  const productsQuery = useProducts(storeId, undefined, {
    enabled: Boolean(storeId) && shouldLoadProducts,
    management: true,
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
  const createProductMutation = useCreateProduct(storeId);
  const updateProductMutation = useUpdateProduct(storeId);
  const deleteProductMutation = useDeleteProduct(storeId);
  const uploadProductImageMutation = useUploadProductImage(storeId);
  const deleteProductImageMutation = useDeleteProductImage(storeId);
  const addVariantMutation = useAddVariant(storeId);
  const updateVariantMutation = useUpdateVariant(storeId);
  const deleteVariantMutation = useDeleteVariant(storeId);

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
  const productsRaw = normalizeProductList(productsQuery.data);
  const categoriesRaw = normalizeListResponse(categoriesQuery.data);
  const sectionsRaw = normalizeListResponse(sectionsQuery.data);
  const couponsRaw = normalizeListResponse(couponsQuery.data);
  const storeCustomersRaw = normalizeListResponse(storeCustomersQuery.data);
  const ordersRaw = normalizeListResponse(ordersQuery.data);

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
  const [productSearchText, setProductSearchText] = useState("");
  const [productLinkFeedback, setProductLinkFeedback] = useState({
    severity: "",
    message: "",
  });
  const deferredProductSearchText = useDeferredValue(productSearchText);

  const newImagePreviews = useMemo(
    () =>
      productForm.newImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [productForm.newImages],
  );
  const variantImagePreviews = useMemo(() => {
    const previews = {};

    productForm.variants.forEach((variant, index) => {
      if (!variant?.imageFile) {
        return;
      }

      previews[getVariantFormKey(variant, index)] = {
        name: variant.imageFile.name,
        url: URL.createObjectURL(variant.imageFile),
      };
    });

    return previews;
  }, [productForm.variants]);

  useEffect(
    () => () => {
      newImagePreviews.forEach((image) => URL.revokeObjectURL(image.url));
    },
    [newImagePreviews],
  );
  useEffect(
    () => () => {
      Object.values(variantImagePreviews).forEach((image) =>
        URL.revokeObjectURL(image.url),
      );
    },
    [variantImagePreviews],
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
          "sku",
          "shortDescription",
          "description",
          "categoryName",
          "sectionName",
          "metaTitle",
          "metaDescription",
        ]) &&
        matchesText(item, deferredProductSearchText, [
          "name",
          "fullName",
          "sku",
          "shortDescription",
          "description",
          "categoryName",
          "sectionName",
          "metaTitle",
          "metaDescription",
        ]),
      ),
    [deferredProductSearchText, deferredSearchText, productsRaw],
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
        matchesText(item, deferredSearchText, ["name", "description"]),
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
          "عميل المتجر";
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
      title: "رقم الطلب",
      render: (row) => row.orderNumber || row.id || "-",
    },
    {
      key: "customerName",
      title: "العميل",
      render: (row) => row.customerName || "غير محدد",
    },
    {
      key: "customerId",
      title: "رقم العميل",
      render: (row) => row.customerId || row.storeCustomerId || "-",
    },
    {
      key: "itemsCount",
      title: "المحتوى",
      render: (row) => `${row.itemsCount ?? 0} قطعة`,
    },
    {
      key: "createdAtLabel",
      title: "تاريخ الطلب",
      render: (row) => row.createdAtLabel || "-",
    },
    {
      key: "totalAmount",
      title: "الإجمالي",
      render: (row) => formatCurrency(row.totalAmount),
    },
    {
      key: "status",
      title: "الحالة الحالية",
      render: (row) => row.statusText || row.statusLabel || "غير محددة",
    },
    {
      key: "details",
      title: "التفاصيل",
      render: (row) => (
        <AppButton
          size="small"
          variant="outlined"
            component={RouterLink}
            to={`/owner/orders/${row.id}`}
        >
          عرض التفاصيل
        </AppButton>
      ),
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

  const pendingOrdersCount = ordersAll.filter(
    (item) => Number(item.status) === 0,
  ).length;
  const storeVisitCount = Number(store?.visitCount ?? store?.VisitCount ?? 0);
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
      label: "زيارات المتجر",
      value: formatUiNumber(storeVisitCount),
      help: "عدد مرات فتح رابط المتجر",
      icon: <VisibilityRoundedIcon fontSize="small" />,
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
    addVariantMutation.error,
    updateVariantMutation.error,
    deleteVariantMutation.error,
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
    wholesalePrice:
      product?.wholesalePrice !== undefined && product?.wholesalePrice !== null
        ? String(product.wholesalePrice)
        : product?.WholesalePrice !== undefined && product?.WholesalePrice !== null
          ? String(product.WholesalePrice)
          : "0",
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
    variants: Array.isArray(product?.variants)
      ? product.variants.map((variant, index) =>
          normalizeVariantFormValue(variant, index),
        )
      : [],
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
    return <LoadingState label="جارٍ تحميل بيانات المتجر..." />;
  }

  if (!store) {
    return (
      <EmptyState
        title="لا يوجد متجر مرتبط بهذا الحساب"
        description="تأكد من وجود متجر مرتبط بصاحب الحساب أو تواصل مع الإدارة."
        action={
          <AppButton component={RouterLink} to="/" variant="contained">
            الرئيسية
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

  const buildPublicProductLink = (product) => {
    if (!store?.slug || !product?.id) {
      return "";
    }

    const pathname = `/market/${store.slug}/product/${product.id}`;
    return typeof window === "undefined"
      ? pathname
      : new URL(pathname, window.location.origin).toString();
  };

  const handleCopyProductLink = async (product) => {
    const url = buildPublicProductLink(product);

    if (!url) {
      setProductLinkFeedback({
        severity: "error",
        message: "تعذر تجهيز رابط هذا المنتج الآن.",
      });
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("clipboard-unavailable");
      }

      await navigator.clipboard.writeText(url);
      setProductLinkFeedback({
        severity: "success",
        message: "تم نسخ رابط المنتج.",
      });
    } catch {
      setProductLinkFeedback({
        severity: "error",
        message: "تعذر نسخ الرابط الآن.",
      });
    }
  };

  const handleShareProductLink = async (product) => {
    const url = buildPublicProductLink(product);

    if (!url) {
      setProductLinkFeedback({
        severity: "error",
        message: "تعذر تجهيز رابط هذا المنتج الآن.",
      });
      return;
    }

    try {
      if (navigator?.share) {
        await navigator.share({
          title: product?.name || "المنتج",
          text: product?.shortDescription || product?.name || "",
          url,
        });
        setProductLinkFeedback({
          severity: "success",
          message: "تم تجهيز الرابط للمشاركة.",
        });
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }

    await handleCopyProductLink(product);
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
    setProductForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleAddVariantRow = () => {
    setProductForm((previous) => ({
      ...previous,
      variants: [
        ...previous.variants,
        buildVariantDraft(previous.variants.length),
      ],
    }));
  };

  const handleVariantFormChange = (index, key, value) => {
    setProductForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [key]: value } : variant,
      ),
    }));
  };

  const handleVariantImageFileChange = (index, file) => {
    if (!file) {
      handleVariantFormChange(index, "imageFile", null);
      return;
    }

    if (!isValidImageFile(file)) {
      setProductFormError(IMAGE_FILE_ERROR);
      return;
    }

    setProductFormError("");
    handleVariantFormChange(index, "imageFile", file);
  };

  const handleRemoveVariantImageFile = (index) => {
    handleVariantFormChange(index, "imageFile", null);
  };

  const handleRemoveVariantRow = async (index) => {
    const variant = productForm.variants[index];

    if (!variant) {
      return;
    }

    if (productForm.mode === "edit" && variant.id) {
      if (!window.confirm("هل تريد تعطيل هذه النسخة؟")) return;

      try {
        await deleteVariantMutation.mutateAsync({
          variantId: variant.id,
          productId: productForm.id,
        });

        setProductForm((previous) => ({
          ...previous,
          variants: previous.variants.filter((_, currentIndex) => currentIndex !== index),
        }));
      } catch {
        // Error is surfaced through the shared error alert.
      }

      return;
    }

    setProductForm((previous) => ({
      ...previous,
      variants: previous.variants.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSaveVariantRow = async (index) => {
    const variant = productForm.variants[index];

    if (productForm.mode !== "edit" || !productForm.id || !variant) {
      return;
    }

    const payload = buildVariantPayload(variant);

    if (!payload.Name) {
      setProductFormError("يرجى إدخال اسم النسخة قبل حفظها.");
      return;
    }

    try {
      setProductFormError("");
      const savedVariant = variant.id
        ? await updateVariantMutation.mutateAsync({
            variantId: variant.id,
            productId: productForm.id,
            payload,
          })
        : await addVariantMutation.mutateAsync({
            productId: productForm.id,
            payload,
            localId: variant.localId,
          });
      const normalizedVariant = normalizeVariantFormValue(savedVariant, index);

      setProductForm((previous) => ({
        ...previous,
        variants: previous.variants.map((item, currentIndex) =>
          currentIndex === index
            ? normalizedVariant
            : item,
        ),
      }));

      if (variant.imageFile && normalizedVariant.id) {
        const uploadedImage = await uploadVariantImage({
          productId: productForm.id,
          variant: normalizedVariant,
          file: variant.imageFile,
        });

        setProductForm((previous) => ({
          ...previous,
          variants: previous.variants.map((item) =>
            item.id === normalizedVariant.id
              ? appendImageToVariant(item, uploadedImage)
              : item,
          ),
        }));
      }
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const handleCategoryFormChange = (key, value) => {
    setCategoryForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSectionFormChange = (key, value) => {
    setSectionForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleAppendImages = (files) => {
    if (!files.length) return;

    const invalidFile = files.find((file) => !isValidImageFile(file));

    if (invalidFile) {
      setProductFormError(
        "يجب أن تكون الصور بصيغة JPG أو JPEG أو PNG أو WEBP، وبحجم لا يتجاوز 5MB للصورة.",
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
    if (!window.confirm("هل تريد حذف هذه الصورة من المنتج؟")) return;

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
          variants: prev.variants.map((variant) => {
            const variantImages = getVariantImages(variant);

            if (!variantImages.some((item) => item.id === image.id)) {
              return variant;
            }

            const remainingVariantImages = variantImages.filter(
              (item) => item.id !== image.id,
            );

            return {
              ...variant,
              images: remainingVariantImages,
              effectiveImageUrl:
                variant.effectiveImageUrl === image.url
                  ? remainingVariantImages[0]?.url || variant.imageUrl || ""
                  : variant.effectiveImageUrl,
            };
          }),
        };
      });
    } catch {
      // Error is surfaced through the shared error alert.
    }
  };

  const uploadVariantImage = async ({ productId, variant, file }) => {
    const variantId = variant?.id || variant?.Id;

    if (!productId || !variantId || !file) {
      return null;
    }

    return uploadProductImageMutation.mutateAsync({
      ProductId: productId,
      VariantId: variantId,
      Image: file,
      AltText: [productForm.name, variant?.name || variant?.Name]
        .filter(Boolean)
        .join(" "),
      DisplayOrder: getVariantImages(variant).length + 1,
      IsPrimary: getVariantImages(variant).length === 0,
    });
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();

    if (!storeId) return;
    if (!categoriesRaw.length || !sectionsRaw.length) return;

    setProductFormError("");

    const payload = {
      Name: productForm.name.trim(),
      Slug: slugify(productForm.name),
      ShortDescription: productForm.shortDescription || undefined,
      Description: productForm.description || undefined,
      Price: Number(productForm.price),
      WholesalePrice: Number(productForm.wholesalePrice || 0),
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
    const variantPayloads = productForm.variants
      .filter((variant) => !variant.id && !isVariantDraftEmpty(variant))
      .map(buildVariantPayload);
    const variantDraftsWithImages = productForm.variants.filter(
      (variant) => !variant.id && !isVariantDraftEmpty(variant) && variant.imageFile,
    );
    const invalidVariant = variantPayloads.find((variant) => !variant.Name);

    if (invalidVariant) {
      setProductFormError("يرجى إدخال اسم لكل نسخة تمت إضافتها.");
      return;
    }

    if (productForm.mode === "edit" && variantPayloads.length) {
      setProductFormError("احفظ النسخ الجديدة من زر حفظ النسخة قبل حفظ المنتج.");
      return;
    }

    try {
      if (productForm.mode === "edit" && productForm.id) {
        await updateProductMutation.mutateAsync({
          productId: productForm.id,
          payload: {
            Name: payload.Name,
            ShortDescription: payload.ShortDescription,
            Description: payload.Description,
            Price: payload.Price,
            WholesalePrice: payload.WholesalePrice,
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

        for (const variant of productForm.variants) {
          if (!variant.id || !variant.imageFile) {
            continue;
          }

          await uploadVariantImage({
            productId: productForm.id,
            variant,
            file: variant.imageFile,
          });
        }

        resetProductForm();
        return;
      }

      const createdProduct = await createProductMutation.mutateAsync({
        ...payload,
        Variants: variantPayloads.length ? variantPayloads : undefined,
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

      if (createdProductId && variantDraftsWithImages.length) {
        let productWithVariants = createdProductEntity;

        if (!Array.isArray(productWithVariants?.variants) || !productWithVariants.variants.length) {
          productWithVariants = normalizeProductDto(
            await productApi.getProductById(createdProductId),
          );
        }

        const createdVariants = Array.isArray(productWithVariants?.variants)
          ? productWithVariants.variants.map((variant, index) =>
              normalizeVariantFormValue(variant, index),
            )
          : [];
        const usedVariantIds = new Set();

        for (const draftVariant of variantDraftsWithImages) {
          const createdVariant = findCreatedVariantForDraft(
            draftVariant,
            createdVariants,
            usedVariantIds,
          );

          if (!createdVariant?.id) {
            continue;
          }

          usedVariantIds.add(String(createdVariant.id));

          await uploadVariantImage({
            productId: createdProductId,
            variant: createdVariant,
            file: draftVariant.imageFile,
          });
        }
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
        slug: slugify(categoryForm.name),
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
        Slug: slugify(sectionForm.name),
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
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <ContactDeveloperButton
                label="الدعم"
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
                عرض المتجر كزائر
              </AppButton>
              <AppButton
                component={RouterLink}
                to="/"
                sx={{ display: "none" }}
                variant="contained"
              >
                السوق
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
                    {store.description || "لم يتم إضافة وصف للمتجر بعد."}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
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

        {activeTab === "products" ? (
          <Paper className="owner-panel" elevation={0}>
            <SectionHeader
              title="إدارة المنتجات"
              description="إضافة منتجات أو تعديلها مع دعم صور متعددة ونشر مباشر."
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
                updateVariantMutation.isPending ||
                uploadProductImageMutation.isPending
              }
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
              onAddVariant={handleAddVariantRow}
              onChangeVariant={handleVariantFormChange}
              onRemoveVariant={handleRemoveVariantRow}
              onSaveVariant={handleSaveVariantRow}
              variantImagePreviews={variantImagePreviews}
              variantImageUploadingId={
                uploadProductImageMutation.isPending
                  ? uploadProductImageMutation.variables?.VariantId
                  : null
              }
              onChangeVariantImageFile={handleVariantImageFileChange}
              onRemoveVariantImageFile={handleRemoveVariantImageFile}
              variantActionLoading={
                addVariantMutation.isPending
                  ? addVariantMutation.variables?.localId
                  : updateVariantMutation.isPending
                    ? updateVariantMutation.variables?.variantId
                    : deleteVariantMutation.isPending
                      ? deleteVariantMutation.variables?.variantId
                      : null
              }
              onReset={resetProductForm}
              onSubmit={handleSubmitProduct}
            />

            <Box className="owner-panel__tools">
              <SearchInput
                value={productSearchText}
                onChange={setProductSearchText}
                placeholder="ابحث عن منتج بالاسم أو الوصف"
                className="owner-panel__search"
              />
              <Typography variant="body2" color="text.secondary">
                {products.length} منتج
              </Typography>
            </Box>

            {productLinkFeedback.message ? (
              <Alert severity={productLinkFeedback.severity || "success"}>
                {productLinkFeedback.message}
              </Alert>
            ) : null}

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
                            {row.shortDescription || row.categoryName || row.sectionName || "بدون وصف"}
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
                        <Typography variant="caption" color="text.secondary">
                          الجملة: {formatCurrency(row.wholesalePrice || 0)}
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
                  {
                    key: "visitCount",
                    title: "الزيارات",
                    render: (row) => formatUiNumber(row.visitCount ?? 0),
                  },
                  { key: "stockQuantity", title: "المخزون" },
                  {
                    key: "actions",
                    title: "إجراءات",
                    render: (row) => (
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
                          onClick={() => handleCopyProductLink(row)}
                        >
                          نسخ الرابط
                        </AppButton>
                        <AppButton
                          size="small"
                          variant="text"
                          onClick={() => handleShareProductLink(row)}
                        >
                          مشاركة
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
                              description: row.description || "",
                              displayOrder: String(row.displayOrder ?? 0),
                              parentCategoryId: row.parentCategoryId || "",
                              isActive: Boolean(row.isActive),
                            })
                          }
                        >
                          تعديل
                        </AppButton>
                      </Stack>
                    ),
                  },
                ].filter((column) => column.key !== "slug")}
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
                              description: row.description || "",
                              displayOrder: String(row.displayOrder ?? 0),
                              isActive: Boolean(row.isActive),
                            })
                          }
                        >
                          تعديل
                        </AppButton>
                      </Stack>
                    ),
                  },
                ].filter((column) => column.key !== "slug")}
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
                  {getApiErrorMessage(storeCustomersQuery.error)}
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
            ) : orders.length ? (
              <Box className="owner-orders-grid">
                {orders.map((row) => {
                  const statusLabel =
                    row.statusText || row.statusLabel || "غير محددة";
                  const customerName =
                    row.customerName || row.customerEmail || "عميل المتجر";
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
                            رقم الطلب
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
                            العميل
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
                            تاريخ الطلب
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
                          <span>المحتوى</span>
                          <strong>{row.itemsCount ?? 0} قطعة</strong>
                        </Box>
                        <Box className="owner-order-card__summary-item">
                          <span>الخصم</span>
                          <strong>{formatCurrency(row.discount)}</strong>
                        </Box>
                        <Box className="owner-order-card__summary-item">
                          <span>الإجمالي</span>
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
                            تفاصيل الطلب
                          </AppButton>
                          {customerId ? (
                            <AppButton
                              component={RouterLink}
                              to={"/owner/customers/" + customerId}
                              size="small"
                              variant="text"
                            >
                              معلومات العميل
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
                title="لا توجد طلبات"
                description="ستظهر هنا الطلبات الجديدة القادمة من المتجر."
              />
            )}
          </Paper>
        ) : null}


      </Box>
    </DashboardLayout>
  );
}
