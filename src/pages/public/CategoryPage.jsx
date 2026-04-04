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
import useProducts from "../../hooks/products/useProducts.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import {
  normalizeEntityResponse,
  normalizeListResponse,
} from "../../utils/collections.js";
import { buildProductSnapshot } from "../../utils/guestCart.js";
import { buildCategorySummary, sortProducts } from "../../utils/storefront.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./CategoryPage.css";

export default function CategoryPage() {
  const { slug, categoryId } = useParams();
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
  const productsQuery = useProducts(store?.id, undefined, {
    enabled: Boolean(store?.id),
  });
  const addToCartMutation = useAddToCart(store?.id);

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

  const categories = normalizeListResponse(categoriesQuery.data);
  const products = normalizeListResponse(productsQuery.data);
  const activeCategory =
    categories.find((category) => String(category.id) === String(categoryId)) || null;

  const availablePrices = products.map((product) =>
    Number(product.finalPrice ?? product.price ?? 0),
  );
  const maxPrice = Math.max(...availablePrices, 0);
  const minFilter = Number(priceInputs.min || 0);
  const maxFilter = Number(priceInputs.max || maxPrice || 0);

  const scopedProducts = products.filter(
    (product) =>
      String(product.categoryId) === String(categoryId) ||
      (!product.categoryId &&
        String(product.categoryName || "").trim() === String(activeCategory?.name || "").trim()),
  );

  const keyword = deferredSearchText.toLowerCase().trim();
  const filteredProducts = sortProducts(
    scopedProducts.filter((product) => {
      const price = Number(product.finalPrice ?? product.price ?? 0);

      if (onlyInStock && Number(product.stockQuantity ?? 0) <= 0) {
        return false;
      }

      if (price < minFilter || price > maxFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [product.name, product.description, product.shortDescription, product.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    }),
    sortValue,
  );

  const categorySummary = buildCategorySummary(products, categories);

  const handleAddToCart = (product) => {
    if (!store?.id || !product?.id) return;

    addToCartMutation.mutate({
      productId: product.id,
      quantity: 1,
      storeId: store.id,
      variantId: null,
      productSnapshot: buildProductSnapshot(product),
    });
  };

  return (
    <Box className="storefront-page page-category">
      <SurfaceCard variant="hero" className="page-category__hero">
        <Box className="storefront-section__copy">
          <span className="storefront-eyebrow">Category page</span>
          <Typography variant="h2">{activeCategory?.name || "التصنيف"}</Typography>
          <Typography variant="body1" className="storefront-subtitle">
            {activeCategory?.description ||
              "صفحة تصفح مركزة تساعد الزائر على تضييق النطاق بسرعة داخل المتجر."}
          </Typography>
        </Box>
      </SurfaceCard>

      <Box className="storefront-grid">
        <Box className="storefront-grid__span-4">
          <SurfaceCard className="page-category__sidebar">
            <Box className="storefront-section__copy">
              <span className="storefront-eyebrow">Filters</span>
              <Typography variant="h5">تضييق النتائج</Typography>
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
                  to={`/market/${store.slug}/category/${category.id}`}
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
                <span className="storefront-eyebrow">Results</span>
                <Typography variant="h5">
                  {filteredProducts.length} نتيجة داخل {activeCategory?.name || "هذا التصنيف"}
                </Typography>
              </Box>

              <AppButton component={RouterLink} to={`/market/${store.slug}`} variant="outlined">
                العودة إلى المتجر
              </AppButton>
            </Box>

            {filteredProducts.length ? (
              <ProductGrid
                products={filteredProducts}
                storeSlug={store.slug}
                onAddToCart={handleAddToCart}
                addingProductId={addToCartMutation.variables?.productId}
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
