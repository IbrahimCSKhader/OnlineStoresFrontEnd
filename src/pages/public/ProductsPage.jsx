import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import ProductGrid, { ProductGridSkeleton } from "../../components/product/ProductGrid.jsx";
import ProductPagination from "../../components/product/ProductPagination.jsx";
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import useSections from "../../hooks/sections/useSections.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  getProductComparePrice,
  getProductDisplayPrice,
  getProductDisplayVariant,
  isProductInStock,
  normalizeProductList,
} from "../../utils/products.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./ProductsPage.css";

const PRODUCTS_PAGE_SIZE = 16;

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = String(item?.[key] || "");
    if (!value) return counts;

    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function getPriceBounds(products) {
  const prices = products
    .map((product) => Number(getProductDisplayPrice(product)))
    .filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return [0, 0];
  }

  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

function buildPagination(items, page, pageSize) {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const normalizedPage = Math.min(Math.max(page, 1), totalPages);
  const start = (normalizedPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: normalizedPage,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: normalizedPage > 1,
    hasNextPage: normalizedPage < totalPages,
  };
}

export default function ProductsPage() {
  const { slug = "" } = useParams();
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [sortValue, setSortValue] = useState("newest");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [priceRange, setPriceRange] = useState(null);
  const [page, setPage] = useState(1);

  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const categoriesQuery = useCategories(store?.id, {
    enabled: Boolean(store?.id),
  });
  const sectionsQuery = useSections(store?.id, {
    enabled: Boolean(store?.id),
  });
  const productsQuery = useStorefrontCatalogProducts(store?.id, {
    enabled: Boolean(store?.id),
    staleTime: 30000,
  });
  const addToCartMutation = useAddToCart(store?.id);
  const addToCartUi = useTransientBusyState();

  const categories = useMemo(
    () => normalizeListResponse(categoriesQuery.data).filter((category) => category?.id),
    [categoriesQuery.data],
  );
  const sections = useMemo(
    () => normalizeListResponse(sectionsQuery.data).filter((section) => section?.id),
    [sectionsQuery.data],
  );
  const products = useMemo(
    () => normalizeProductList(productsQuery.data),
    [productsQuery.data],
  );
  const [minPrice, maxPrice] = useMemo(() => getPriceBounds(products), [products]);
  const activePriceRange = useMemo(
    () => priceRange || [minPrice, maxPrice],
    [maxPrice, minPrice, priceRange],
  );
  const keyword = normalizeText(deferredSearchText);

  const categoryCounts = useMemo(() => countBy(products, "categoryId"), [products]);
  const sectionCounts = useMemo(() => countBy(products, "sectionId"), [products]);

  const filteredProducts = useMemo(() => {
    const nextProducts = products.filter((product) => {
      const price = Number(getProductDisplayPrice(product));
      const comparePrice = Number(getProductComparePrice(product));
      const searchable = [
        product?.name,
        product?.shortDescription,
        product?.description,
        product?.sku,
        product?.categoryName,
        product?.sectionName,
      ]
        .map(normalizeText)
        .join(" ");

      if (keyword && !searchable.includes(keyword)) return false;
      if (selectedCategoryId !== "all" && String(product?.categoryId) !== selectedCategoryId) return false;
      if (selectedSectionId !== "all" && String(product?.sectionId) !== selectedSectionId) return false;
      if (onlyInStock && !isProductInStock(product)) return false;
      if (onlyFeatured && !product?.isFeatured) return false;
      if (onlyDiscounted && !(comparePrice > price)) return false;
      if (Number.isFinite(price) && price < activePriceRange[0]) return false;
      if (Number.isFinite(price) && price > activePriceRange[1]) return false;

      return true;
    });

    return nextProducts.sort((a, b) => {
      const priceA = Number(getProductDisplayPrice(a));
      const priceB = Number(getProductDisplayPrice(b));

      switch (sortValue) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "alphabetical":
          return String(a?.name || "").localeCompare(String(b?.name || ""), "ar");
        case "popular":
          return Number(b?.visitCount || 0) - Number(a?.visitCount || 0);
        default:
          return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
      }
    });
  }, [
    activePriceRange,
    keyword,
    onlyDiscounted,
    onlyFeatured,
    onlyInStock,
    products,
    selectedCategoryId,
    selectedSectionId,
    sortValue,
  ]);

  const pagination = useMemo(
    () => buildPagination(filteredProducts, page, PRODUCTS_PAGE_SIZE),
    [filteredProducts, page],
  );
  const hasActiveFilters =
    keyword ||
    selectedCategoryId !== "all" ||
    selectedSectionId !== "all" ||
    onlyInStock ||
    onlyFeatured ||
    onlyDiscounted ||
    activePriceRange[0] !== minPrice ||
    activePriceRange[1] !== maxPrice ||
    sortValue !== "newest";
  const strongestCategory = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          count: categoryCounts.get(String(category.id)) || 0,
        }))
        .sort((a, b) => b.count - a.count)[0],
    [categories, categoryCounts],
  );

  const resetPage = () => setPage(1);
  const resetFilters = () => {
    setSearchText("");
    setSelectedCategoryId("all");
    setSelectedSectionId("all");
    setSortValue("newest");
    setOnlyInStock(false);
    setOnlyFeatured(false);
    setOnlyDiscounted(false);
    setPriceRange([minPrice, maxPrice]);
    setPage(1);
  };

  const handleAddToCart = (product) => {
    if (isOwnerPreview || !store?.id || !product?.id) return;

    const defaultVariant = getProductDisplayVariant(product);

    addToCartUi.markBusy(product.id);
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      storeId: store.id,
      variantId: defaultVariant?.id || null,
      productSnapshot: buildProductSnapshot(product, {
        variant: defaultVariant,
      }),
      debugSource: "products-page",
    });
  };

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-products">
        <EmptyState title="جاري تحميل المنتجات..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-products">
        <EmptyState
          title="تعذر فتح المنتجات"
          description="تعذر العثور على المتجر المطلوب."
        />
      </Box>
    );
  }

  return (
    <Box className="storefront-page page-products">
      <SurfaceCard variant="hero" className="page-products__hero">
        <Box className="page-products__hero-copy">
          <span className="storefront-eyebrow">المنتجات</span>
          <Typography variant="h2">كل تشكيلات {store.name}</Typography>
          <Typography variant="body1" className="storefront-subtitle">
            فلترة سريعة حسب السعر، الفئة، القسم، التوفر والعروض.
          </Typography>
        </Box>

        <Stack direction="row" className="page-products__hero-stats">
          <Box className="page-products__stat">
            <Inventory2RoundedIcon fontSize="small" />
            <span>{products.length.toLocaleString("ar")} منتج</span>
          </Box>
          <Box className="page-products__stat">
            <FilterAltRoundedIcon fontSize="small" />
            <span>{filteredProducts.length.toLocaleString("ar")} نتيجة</span>
          </Box>
          <Box className="page-products__stat">
            <LocalOfferRoundedIcon fontSize="small" />
            <span>{formatCurrency(activePriceRange[0])} - {formatCurrency(activePriceRange[1])}</span>
          </Box>
        </Stack>
      </SurfaceCard>

      <Box className="page-products__layout">
        <SurfaceCard className="page-products__filters">
          <Box className="page-products__filters-head">
            <Box>
              <span className="storefront-eyebrow">فلترة ذكية</span>
              <Typography variant="h5">اختصر الطريق</Typography>
            </Box>
            {hasActiveFilters ? (
              <AppButton
                variant="text"
                appearance="ghost"
                startIcon={<RestartAltRoundedIcon fontSize="small" />}
                onClick={resetFilters}
              >
                تصفير
              </AppButton>
            ) : null}
          </Box>

          <SearchInput
            value={searchText}
            onChange={(value) => {
              setSearchText(value);
              resetPage();
            }}
            placeholder="ابحث باسم المنتج أو الوصف"
          />

          <Box className="page-products__filter-group">
            <Typography variant="subtitle2">السعر</Typography>
            <Box className="page-products__price-range">
              <Slider
                value={activePriceRange}
                min={minPrice}
                max={maxPrice || 1}
                step={1}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => formatCurrency(value)}
                marks={[
                  { value: minPrice, label: formatCurrency(minPrice) },
                  { value: maxPrice, label: formatCurrency(maxPrice) },
                ]}
                onChange={(_, value) => {
                  setPriceRange(value);
                  resetPage();
                }}
                disabled={minPrice === maxPrice}
              />
            </Box>
          </Box>

          <Box className="page-products__filter-grid">
            <AppTextField
              select
              label="الفئة"
              value={selectedCategoryId}
              onChange={(event) => {
                setSelectedCategoryId(event.target.value);
                resetPage();
              }}
              SelectProps={{ native: true }}
            >
              <option value="all">كل الفئات</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({categoryCounts.get(String(category.id)) || 0})
                </option>
              ))}
            </AppTextField>

            <AppTextField
              select
              label="القسم"
              value={selectedSectionId}
              onChange={(event) => {
                setSelectedSectionId(event.target.value);
                resetPage();
              }}
              SelectProps={{ native: true }}
            >
              <option value="all">كل الأقسام</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} ({sectionCounts.get(String(section.id)) || 0})
                </option>
              ))}
            </AppTextField>

            <AppTextField
              select
              label="الترتيب"
              value={sortValue}
              onChange={(event) => {
                setSortValue(event.target.value);
                resetPage();
              }}
              SelectProps={{ native: true }}
            >
              <option value="newest">الأحدث</option>
              <option value="popular">الأكثر مشاهدة</option>
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
              <option value="alphabetical">أبجدياً</option>
            </AppTextField>
          </Box>

          <Box className="page-products__switches">
            <FormControlLabel
              control={
                <Switch
                  checked={onlyInStock}
                  onChange={(event) => {
                    setOnlyInStock(event.target.checked);
                    resetPage();
                  }}
                />
              }
              label="المتوفر فقط"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={onlyFeatured}
                  onChange={(event) => {
                    setOnlyFeatured(event.target.checked);
                    resetPage();
                  }}
                />
              }
              label="المميز فقط"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={onlyDiscounted}
                  onChange={(event) => {
                    setOnlyDiscounted(event.target.checked);
                    resetPage();
                  }}
                />
              }
              label="العروض فقط"
            />
          </Box>

          <Box className="page-products__smart-chips">
            {strongestCategory?.count ? (
              <Chip
                icon={<AutoAwesomeRoundedIcon />}
                label={`الأكثر تنوعاً: ${strongestCategory.name}`}
                onClick={() => {
                  setSelectedCategoryId(String(strongestCategory.id));
                  resetPage();
                }}
              />
            ) : null}
            <Chip
              label="الأقل سعراً"
              onClick={() => {
                setSortValue("price-asc");
                resetPage();
              }}
            />
            <Chip
              label="الأحدث"
              onClick={() => {
                setSortValue("newest");
                resetPage();
              }}
            />
          </Box>
        </SurfaceCard>

        <SurfaceCard className="page-products__results" id="products-results">
          <Box className="page-products__results-head">
            <Box>
              <span className="storefront-eyebrow">النتائج</span>
              <Typography variant="h5">
                {filteredProducts.length.toLocaleString("ar")} منتج مطابق
              </Typography>
            </Box>
            <AppButton
              component={RouterLink}
              to={buildStorePreviewPath(`/market/${store.slug}`)}
              variant="outlined"
            >
              العودة للمتجر
            </AppButton>
          </Box>

          {productsQuery.isLoading ? (
            <ProductGridSkeleton
              count={PRODUCTS_PAGE_SIZE}
              className="page-products__products-grid"
            />
          ) : pagination.items.length ? (
            <>
              <ProductGrid
                products={pagination.items}
                storeSlug={store.slug}
                onAddToCart={handleAddToCart}
                addingProductId={addToCartUi.activeKey}
                disableCartActions={isOwnerPreview}
                linkSearch={previewSearch}
                className="page-products__products-grid"
                scrollAnchorScope="products-results"
              />
              <ProductPagination
                pagination={pagination}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  document
                    .getElementById("products-results")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            </>
          ) : (
            <EmptyState
              title="لا توجد نتائج"
              description="خفف الفلاتر أو جرّب نطاق سعر أوسع."
            />
          )}
        </SurfaceCard>
      </Box>
    </Box>
  );
}
