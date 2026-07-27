import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import ProductGrid from "../../components/product/ProductGrid.jsx";
import ProductPagination from "../../components/product/ProductPagination.jsx";
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useProductsByCategory from "../../hooks/products/useProductsByCategory.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
  normalizePagedResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  getProductDisplayVariant,
  normalizeProductList,
} from "../../utils/products.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./CategoryPage.css";

const CATEGORY_PAGE_SIZE = 12;

export default function CategoryPage() {
  const { slug, categoryId } = useParams();
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState("newest");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });
  const keyword = deferredSearchText.toLowerCase().trim();

  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const categoriesQuery = useCategories(store?.id, {
    enabled: Boolean(store?.id),
  });
  const categories = useMemo(
    () =>
      normalizeListResponse(categoriesQuery.data).filter(
        (category) => category?.id,
      ),
    [categoriesQuery.data],
  );
  const catalogProductsQuery = useProductsByCategory(categoryId, {
    enabled: Boolean(categoryId) && Boolean(store?.id),
    params: {
      page,
      pageSize: CATEGORY_PAGE_SIZE,
      search: keyword || undefined,
      sort: sortValue,
      onlyInStock: onlyInStock || undefined,
      minPrice: priceInputs.min || undefined,
      maxPrice: priceInputs.max || undefined,
    },
    staleTime: 30000,
  });
  const addToCartMutation = useAddToCart(store?.id);
  const addToCartUi = useTransientBusyState();

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-category">
        <EmptyState title="جاري تحميل الصفحة..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-category">
        <EmptyState
          title="تعذر فتح هذا التصنيف"
          description="تعذر العثور على المتجر أو التصنيف المطلوب."
        />
      </Box>
    );
  }

  const activeCategory =
    categories.find((category) => String(category.id) === String(categoryId)) || null;
  const categoryPagination = normalizePagedResponse(catalogProductsQuery.data);
  const filteredProducts = normalizeProductList(categoryPagination.items);
  const categorySummary = categories.map((category) => ({
    ...category,
    count:
      String(category.id) === String(categoryId)
        ? categoryPagination.totalCount
        : null,
  }));

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
      debugSource: "category-page",
    });
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);

    if (typeof document !== "undefined") {
      document
        .getElementById("category-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearchChange = (value) => {
    setSearchText(value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSortValue(event.target.value);
    setPage(1);
  };

  const handlePriceInputChange = (key) => (event) => {
    setPriceInputs((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
    setPage(1);
  };

  const handleOnlyInStockChange = (event) => {
    setOnlyInStock(event.target.checked);
    setPage(1);
  };

  return (
    <Box className="storefront-page page-category">
      <SurfaceCard variant="hero" className="page-category__hero">
        <Box className="storefront-section__copy">
          <span className="storefront-eyebrow">التصنيف</span>
          <Typography variant="h2">{activeCategory?.name || "التصنيف"}</Typography>
          {activeCategory?.description ? (
            <Typography variant="body1" className="storefront-subtitle">
              {activeCategory.description}
            </Typography>
          ) : null}
        </Box>
      </SurfaceCard>

      <Box className="storefront-grid">
        <Box className="storefront-grid__span-4">
          <SurfaceCard className="page-category__sidebar">
            <Box className="storefront-section__copy">
              <span className="storefront-eyebrow">فلترة</span>
              <Typography variant="h5">الخيارات</Typography>
            </Box>

            <SearchInput
              value={searchText}
              onChange={handleSearchChange}
              placeholder="ابحث داخل هذا التصنيف"
            />

            <AppTextField
              select
              label="الترتيب"
              value={sortValue}
              onChange={handleSortChange}
              SelectProps={{ native: true }}
            >
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
              <option value="newest">الأحدث</option>
              <option value="alphabetical">أبجديًا</option>
            </AppTextField>

            <Box className="page-category__price-grid">
              <AppTextField
                type="number"
                label="أقل سعر"
                value={priceInputs.min}
                onChange={handlePriceInputChange("min")}
              />
              <AppTextField
                type="number"
                label="أعلى سعر"
                value={priceInputs.max}
                onChange={handlePriceInputChange("max")}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={onlyInStock}
                  onChange={handleOnlyInStockChange}
                />
              }
              label="عرض المتوفر فقط"
            />

            <Box className="page-category__category-list">
              {categorySummary.map((category) => (
                <AppButton
                  key={category.id}
                  component={RouterLink}
                  to={buildStorePreviewPath(
                    `/market/${store.slug}/category/${category.id}`,
                  )}
                  onClick={() => setPage(1)}
                  variant={String(category.id) === String(categoryId) ? "contained" : "outlined"}
                >
                  {category.count === null
                    ? category.name
                    : `${category.name} (${category.count})`}
                </AppButton>
              ))}
            </Box>
          </SurfaceCard>
        </Box>

        <Box className="storefront-grid__span-8">
          <SurfaceCard
            className="page-category__results"
            id="category-results"
            data-scroll-section
          >
            <Box className="storefront-section__head">
              <Box className="storefront-section__copy">
                <span className="storefront-eyebrow">النتائج</span>
                <Typography variant="h5">
                  {categoryPagination.totalCount} نتيجة داخل {activeCategory?.name || "هذا التصنيف"}
                </Typography>
              </Box>

              <AppButton
                component={RouterLink}
                to={buildStorePreviewPath(`/market/${store.slug}`)}
                variant="outlined"
              >
                العودة إلى المتجر
              </AppButton>
            </Box>

            {catalogProductsQuery.isLoading ? (
              <EmptyState title="جاري تحميل المنتجات..." />
            ) : filteredProducts.length ? (
              <>
                <ProductGrid
                  products={filteredProducts}
                  storeSlug={store.slug}
                  onAddToCart={handleAddToCart}
                  addingProductId={addToCartUi.activeKey}
                  disableCartActions={isOwnerPreview}
                  linkSearch={previewSearch}
                  className="page-category__products-grid"
                  scrollAnchorScope="category-results"
                />
                <ProductPagination
                  pagination={categoryPagination}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptyState
                title="لا توجد نتائج"
                description="غيّر ترتيب النتائج أو نطاق السعر أو جرّب كلمة بحث مختلفة."
              />
            )}
          </SurfaceCard>
        </Box>
      </Box>
    </Box>
  );
}
