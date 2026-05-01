import { useMemo } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
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
import { normalizeEntityResponse } from "../../utils/collections.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import extractApiError from "../../utils/extractApiError.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./Cart.css";

export default function Cart() {
  const { slug } = useParams();
  const auth = useAuth();
  const { storeCustomer } = auth;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(() => normalizeEntityResponse(storeQuery.data), [storeQuery.data]);

  useStoreBranding(store);
  const storefrontSession = useStorefrontSession(store?.id, slug);
  const activeStoreCustomer = storefrontSession.hasScopedStorefrontSession
    ? storeCustomer || storefrontSession.storefrontCustomer
    : null;

  const cartQuery = useCart(store?.id, {
    enabled: Boolean(store?.id),
  });
  const updateCartItemMutation = useUpdateCartItem(store?.id);
  const removeCartItemMutation = useRemoveCartItem(store?.id);
  const clearCartMutation = useClearCart(store?.id);

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState title="جارٍ تحميل السلة..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState
          title="تعذر فتح السلة"
          description="لم نتمكن من العثور على المتجر المرتبط بهذه السلة."
        />
      </Box>
    );
  }

  if (storefrontSession.hasConflictingStoreCustomerSession) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState
          title="يلزم تسجيل الدخول لهذا المتجر"
          description="الجلسة الحالية مرتبطة بمتجر آخر، لذا لا يمكن تحميل سلة هذا المتجر."
          action={
            <AppButton
              component={RouterLink}
              to={`/market/${slug}/login`}
              variant="contained"
            >
              تسجيل الدخول لهذا المتجر
            </AppButton>
          }
        />
      </Box>
    );
  }

  const cart = normalizeCartResponse(cartQuery.data);

  return (
    <Box className="storefront-page page-cart">
      {storefrontSession.useLocalGuestCart && !activeStoreCustomer ? (
        <Alert severity="info">
          يمكنك استعراض السلة كزائر، لكن عند إتمام الطلب سيُطلب منك تسجيل الدخول لهذا
          المتجر.
        </Alert>
      ) : null}

      {updateCartItemMutation.isError ? (
        <Alert severity="error">
          {extractApiError(updateCartItemMutation.error, "تعذر تحديث كمية العنصر.")}
        </Alert>
      ) : null}

      {removeCartItemMutation.isError ? (
        <Alert severity="error">
          {extractApiError(removeCartItemMutation.error, "تعذر حذف العنصر من السلة.")}
        </Alert>
      ) : null}

      {clearCartMutation.isError ? (
        <Alert severity="error">
          {extractApiError(clearCartMutation.error, "تعذر تفريغ السلة.")}
        </Alert>
      ) : null}

      {clearCartMutation.isSuccess ? (
        <Alert severity="success">
          {clearCartMutation.data?.message || "تم تفريغ السلة بنجاح."}
        </Alert>
      ) : null}

      <SurfaceCard className="page-cart__hero">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">السلة</span>
            <Typography variant="h2">سلة {store.name}</Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={`/market/${slug}`} variant="outlined">
              متابعة التسوق
            </AppButton>
            <AppButton
              variant="text"
              appearance="ghost"
              onClick={() =>
                clearCartMutation.mutate({ debugSource: "customer-cart-page-hero" })
              }
              disabled={clearCartMutation.isPending || !cart.items.length}
            >
              تفريغ السلة
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      {cartQuery.isLoading ? (
        <EmptyState title="جارٍ تحميل عناصر السلة..." />
      ) : !cart.items.length ? (
        <EmptyState
          title="السلة فارغة"
          description="ابدأ من صفحة المتجر وأضف المنتجات التي تريدها ثم عد هنا للمراجعة."
          action={
            <AppButton component={RouterLink} to={`/market/${slug}`} variant="contained">
              العودة إلى المتجر
            </AppButton>
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
                      <CartItem item={row} storeSlug={slug} />

                      <Box className="page-cart__item-meta">
                        <Box className="page-cart__item-stat">
                          <span>السعر</span>
                          <strong>{formatCurrency(row.unitPrice)}</strong>
                        </Box>
                        <Box className="page-cart__item-stat">
                          <span>الإجمالي</span>
                          <strong>{formatCurrency(row.totalPrice)}</strong>
                        </Box>
                      </Box>

                      <Divider />

                      <Box className="page-cart__item-actions">
                        <QuantityStepper
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
                        >
                          حذف
                        </AppButton>
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
                      title: "المنتج",
                      render: (row) => <CartItem item={row} storeSlug={slug} />,
                    },
                    {
                      key: "price",
                      title: "السعر",
                      render: (row) => formatCurrency(row.unitPrice),
                    },
                    {
                      key: "quantity",
                      title: "الكمية",
                      render: (row) => (
                        <QuantityStepper
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
                      title: "الإجمالي",
                      render: (row) => formatCurrency(row.totalPrice),
                    },
                    {
                      key: "actions",
                      title: "إجراء",
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
                        >
                          حذف
                        </AppButton>
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
              checkoutPath={`/market/${slug}/checkout`}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
