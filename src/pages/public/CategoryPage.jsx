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
import useAddToCart from "../../hooks/cart/useAddToCart.js";
import useCategories from "../../hooks/categories/useCategories.js";
import useProductsByCategory from "../../hooks/products/useProductsByCategory.js";
import useStorefrontCatalogProducts from "../../hooks/products/useStorefrontCatalogProducts.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useOwnerStorePreview from "../../hooks/stores/useOwnerStorePreview.js";
import useTransientBusyState from "../../hooks/useTransientBusyState.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import {
  getProductDisplayPrice,
  isProductInStock,
  normalizeProductList,
} from "../../utils/products.js";
import { buildCategorySummary, sortProducts } from "../../utils/storefront.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./CategoryPage.css";

export default function CategoryPage() {
  const { slug, categoryId } = useParams();
  const { isOwnerPreview, previewSearch, buildStorePreviewPath } =
    useOwnerStorePreview();
  const [searchText, setSearchText] = useState("");
  const deferredSearchText = useDeferredValue(searchText);
  const [sortValue, setSortValue] = useState("popular");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });

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
  const productsQuery = useProductsByCategory(categoryId, {
    enabled: Boolean(categoryId),
  });
  const catalogProductsQuery = useStorefrontCatalogProducts(categories, {
    enabled: Boolean(store?.id),
    staleTime: 30000,
  });
  const addToCartMutation = useAddToCart(store?.id);
  const addToCartUi = useTransientBusyState();

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-category">
        <EmptyState title="جارٍ تحميل الصفحة..." />
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
  const products = normalizeProductList(productsQuery.data);
  const allStoreProducts = catalogProductsQuery.data;
  const availablePrices = products.map((product) => getProductDisplayPrice(product));
  const maxPrice = Math.max(...availablePrices, 0);
  const minFilter = Number(priceInputs.min || 0);
  const maxFilter = Number(priceInputs.max || maxPrice || 0);
  const keyword = deferredSearchText.toLowerCase().trim();
  const filteredProducts = sortProducts(
    products.filter((product) => {
      const price = getProductDisplayPrice(product);

      if (onlyInStock && !isProductInStock(product)) {
        return false;
      }

      if (price < minFilter || price > maxFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [product.name, product.description, product.shortDescription]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    }),
    sortValue,
  );

  const categorySummary = buildCategorySummary(allStoreProducts, categories);

  const handleAddToCart = (product) => {
    if (isOwnerPreview || !store?.id || !product?.id) return;

    addToCartUi.markBusy(product.id);
    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      storeId: store.id,
      variantId: null,
      productSnapshot: buildProductSnapshot(product),
      debugSource: "category-page",
    });
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
              onChange={setSearchText}
              placeholder="ابحث داخل هذا التصنيف"
            />

            <AppTextField
              select
              label="الترتيب"
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="popular">الأكثر مشاهدة</option>
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
                onChange={(event) =>
                  setPriceInputs((previous) => ({
                    ...previous,
                    min: event.target.value,
                  }))
                }
              />
              <AppTextField
                type="number"
                label="أعلى سعر"
                value={priceInputs.max}
                onChange={(event) =>
                  setPriceInputs((previous) => ({
                    ...previous,
                    max: event.target.value,
                  }))
                }
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={onlyInStock}
                  onChange={(event) => setOnlyInStock(event.target.checked)}
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
                  variant={String(category.id) === String(categoryId) ? "contained" : "outlined"}
                >
                  {category.name} ({category.count})
                </AppButton>
              ))}
            </Box>
          </SurfaceCard>
        </Box>

        <Box className="storefront-grid__span-8">
          <SurfaceCard className="page-category__results">
            <Box className="storefront-section__head">
              <Box className="storefront-section__copy">
                <span className="storefront-eyebrow">النتائج</span>
                <Typography variant="h5">
                  {filteredProducts.length} نتيجة داخل {activeCategory?.name || "هذا التصنيف"}
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

            {productsQuery.isLoading ? (
              <EmptyState title="جارٍ تحميل المنتجات..." />
            ) : filteredProducts.length ? (
              <ProductGrid
                products={filteredProducts}
                storeSlug={store.slug}
                onAddToCart={handleAddToCart}
                addingProductId={addToCartUi.activeKey}
                disableCartActions={isOwnerPreview}
                linkSearch={previewSearch}
              />
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
