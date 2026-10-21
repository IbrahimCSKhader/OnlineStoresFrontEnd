import { useMemo } from "react";
import { Navigate, Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import QuantityStepper from "../../components/common/inputs/QuantityStepper.jsx";
import CartItem from "../../components/cart/CartItem.jsx";
import CartSummary from "../../components/cart/CartSummary.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useCart from "../../hooks/cart/useCart.js";
import useRemoveCartItem from "../../hooks/cart/useRemoveCartItem.js";
import useUpdateCartItem from "../../hooks/cart/useUpdateCartItem.js";
import useClearCart from "../../hooks/cart/useClearCart.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import extractApiError from "../../utils/extractApiError.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./Cart.css";

export default function Cart() {
  const { slug } = useParams();
  const auth = useAuth();
  const { storeCustomer } = auth;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, language } = useStorefrontLanguage();

  const storeQuery = useStoreBySlug(slug, { language });
  const store = useMemo(() => normalizeEntityResponse(storeQuery.data), [storeQuery.data]);

  useStoreBranding(store);
  const storefrontSession = useStorefrontSession(store?.id, slug);
  const activeStoreCustomer = storefrontSession.hasScopedStorefrontSession
    ? storeCustomer || storefrontSession.storefrontCustomer
    : null;

  const cartQuery = useCart(store?.id, {
    enabled: Boolean(store?.id) && !store?.isCatalog,
  });
  const updateCartItemMutation = useUpdateCartItem(store?.id);
  const removeCartItemMutation = useRemoveCartItem(store?.id);
  const clearCartMutation = useClearCart(store?.id);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState title={t("جارٍ تحميل السلة...")} />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState
          title={t("تعذر فتح السلة")}
          description={t("لم نتمكن من العثور على المتجر المرتبط بهذه السلة.")}
        />
      </Box>
    );
  }

  const resolvedStoreSlug = store.slug || slug || "";
  const storeHomePath = buildStorefrontPath(resolvedStoreSlug);
  const storeLoginPath = buildStorefrontPath(resolvedStoreSlug, "/login");
  const storeCheckoutPath = buildStorefrontPath(resolvedStoreSlug, "/checkout");

  if (store.isCatalog) return <Navigate to={storeHomePath} replace />;

  if (storefrontSession.hasConflictingStoreCustomerSession) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState
          title={t("يلزم تسجيل الدخول لهذا المتجر")}
          description={t("الجلسة الحالية مرتبطة بمتجر آخر، لذا لا يمكن تحميل سلة هذا المتجر.")}
          action={
            <AppButton
              component={RouterLink}
              to={storeLoginPath}
              variant="contained"
            >{t("تسجيل الدخول لهذا المتجر")}</AppButton>
          }
        />
      </Box>
    );
  }

  const cart = normalizeCartResponse(cartQuery.data);

  return (
    <Box className="storefront-page page-cart">
      {storefrontSession.useLocalGuestCart && !activeStoreCustomer ? (
        <Alert severity="info">{t("يمكنك استعراض السلة كزائر، لكن عند إتمام الطلب سيُطلب منك تسجيل الدخول لهذا المتجر.")}</Alert>
      ) : null}

      {updateCartItemMutation.isError ? (
        <Alert severity="error">
          {extractApiError(updateCartItemMutation.error, t("تعذر تحديث كمية العنصر."))}
        </Alert>
      ) : null}

      {removeCartItemMutation.isError ? (
        <Alert severity="error">
          {extractApiError(removeCartItemMutation.error, t("تعذر حذف العنصر من السلة."))}
        </Alert>
      ) : null}

      {clearCartMutation.isError ? (
        <Alert severity="error">
          {extractApiError(clearCartMutation.error, t("تعذر تفريغ السلة."))}
        </Alert>
      ) : null}

      {clearCartMutation.isSuccess ? (
        <Alert severity="success">
          {clearCartMutation.data?.message || t("تم تفريغ السلة بنجاح.")}
        </Alert>
      ) : null}

      <SurfaceCard className="page-cart__hero">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">{t("السلة")}</span>
            <Typography variant="h2">{t("سلة")} {store.name}</Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={storeHomePath} variant="outlined">{t("متابعة التسوق")}</AppButton>
            <AppButton
              variant="text"
              appearance="ghost"
              onClick={() =>
                clearCartMutation.mutate({ debugSource: "customer-cart-page-hero" })
              }
              disabled={clearCartMutation.isPending || !cart.items.length}
            >{t("تفريغ السلة")}</AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      {cartQuery.isLoading ? (
        <EmptyState title={t("جارٍ تحميل عناصر السلة...")} />
      ) : !cart.items.length ? (
        <EmptyState
          title={t("السلة فارغة")}
          description={t("ابدأ من صفحة المتجر وأضف المنتجات التي تريدها ثم عد هنا للمراجعة.")}
          action={
            <AppButton component={RouterLink} to={storeHomePath} variant="contained">{t("العودة إلى المتجر")}</AppButton>
          }
        />
      ) : (
        <Box className="storefront-grid">
          <Box className="storefront-grid__span-8">
            <SurfaceCard className="page-cart__table-card">
              {isMobile ? (
                <Box className="page-cart__items">
                  {cart.items.map((row) => (
                    <SurfaceCard key={row.id} className="page-cart__item-card">
                      <CartItem item={row} storeSlug={resolvedStoreSlug} />

                      <Box className="page-cart__item-meta">
                        <Box className="page-cart__item-stat">
                          <span>{t("السعر")}</span>
                          <strong>{formatCurrency(row.unitPrice)}</strong>
                        </Box>
                        <Box className="page-cart__item-stat">
                          <span>{t("الإجمالي")}</span>
                          <strong>{formatCurrency(row.totalPrice)}</strong>
                        </Box>
                      </Box>

                      <Divider />

                      <Box className="page-cart__item-actions">
                        <QuantityStepper
                          decreaseLabel={t("تقليل الكمية")}
                          increaseLabel={t("زيادة الكمية")}
                          value={row.quantity}
                          min={1}
                          max={row.availableStock || undefined}
                          onChange={(nextValue) =>
                            updateCartItemMutation.mutate({
                              cartItemId: row.id,
                              payload: { quantity: nextValue },
                              debugSource: "customer-cart-page-mobile",
                            })
                          }
                        />

                        <AppButton
                          variant="text"
                          appearance="ghost"
                          onClick={() =>
                            removeCartItemMutation.mutate({
                              cartItemId: row.id,
                              debugSource: "customer-cart-page-mobile",
                            })
                          }
                        >{t("حذف")}</AppButton>
                      </Box>
                    </SurfaceCard>
                  ))}
                </Box>
              ) : (
                <AppDataTable
                  zebra
                  rows={cart.items}
                  columns={[
                    {
                      key: "product",
                      title: t("المنتج"),
                      render: (row) => <CartItem item={row} storeSlug={resolvedStoreSlug} />,
                    },
                    {
                      key: "price",
                      title: t("السعر"),
                      render: (row) => formatCurrency(row.unitPrice),
                    },
                    {
                      key: "quantity",
                      title: t("الكمية"),
                      render: (row) => (
                        <QuantityStepper
                          decreaseLabel={t("تقليل الكمية")}
                          increaseLabel={t("زيادة الكمية")}
                          value={row.quantity}
                          min={1}
                          max={row.availableStock || undefined}
                          onChange={(nextValue) =>
                            updateCartItemMutation.mutate({
                              cartItemId: row.id,
                              payload: { quantity: nextValue },
                              debugSource: "customer-cart-page-table",
                            })
                          }
                        />
                      ),
                    },
                    {
                      key: "total",
                      title: t("الإجمالي"),
                      render: (row) => formatCurrency(row.totalPrice),
                    },
                    {
                      key: "actions",
                      title: t("إجراء"),
                      render: (row) => (
                        <AppButton
                          variant="text"
                          appearance="ghost"
                          onClick={() =>
                            removeCartItemMutation.mutate({
                              cartItemId: row.id,
                              debugSource: "customer-cart-page-table",
                            })
                          }
                        >{t("حذف")}</AppButton>
                      ),
                    },
                  ]}
                />
              )}
            </SurfaceCard>
          </Box>

          <Box className="storefront-grid__span-4">
            <CartSummary
              subtotal={cart.subtotal}
              totalAmount={cart.totalAmount}
              itemCount={cart.itemCount}
              checkoutPath={storeCheckoutPath}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
