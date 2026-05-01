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
        <EmptyState title="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط³ظ„ط©..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState
          title="طھط¹ط°ط± ظپطھط­ ط§ظ„ط³ظ„ط©"
          description="ظ„ظ… ظ†طھظ…ظƒظ† ظ…ظ† ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ظ…طھط¬ط± ط§ظ„ظ…ط±طھط¨ط· ط¨ظ‡ط°ظ‡ ط§ظ„ط³ظ„ط©."
        />
      </Box>
    );
  }

  if (storefrontSession.hasConflictingStoreCustomerSession) {
    return (
      <Box className="storefront-page page-cart">
        <EmptyState
          title="ظٹظ„ط²ظ… طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"
          description="ط§ظ„ط¬ظ„ط³ط© ط§ظ„ط­ط§ظ„ظٹط© ظ…ط±طھط¨ط·ط© ط¨ظ…طھط¬ط± ط¢ط®ط±طŒ ظ„ط°ط§ ظ„ط§ ظٹظ…ظƒظ† طھط­ظ…ظٹظ„ ط³ظ„ط© ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±."
          action={
            <AppButton
              component={RouterLink}
              to={`/market/${slug}/login`}
              variant="contained"
            >
              طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±
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
          طھظ‚ط¯ط± طھط³طھط¹ط±ط¶ ط³ظ„طھظƒ ظƒط²ط§ط¦ط±. ط¹ظ†ط¯ ط¥ط±ط³ط§ظ„ ط§ظ„ط·ظ„ط¨ ط³ظٹط·ظ„ط¨ ظ…ظ†ظƒ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±.
        </Alert>
      ) : null}

      {updateCartItemMutation.isError ? (
        <Alert severity="error">
          {extractApiError(updateCartItemMutation.error, "طھط¹ط°ط± طھط­ط¯ظٹط« ظƒظ…ظٹط© ط§ظ„ط¹ظ†طµط±.")}
        </Alert>
      ) : null}

      {removeCartItemMutation.isError ? (
        <Alert severity="error">
          {extractApiError(removeCartItemMutation.error, "طھط¹ط°ط± ط­ط°ظپ ط§ظ„ط¹ظ†طµط± ظ…ظ† ط§ظ„ط³ظ„ط©.")}
        </Alert>
      ) : null}

      {clearCartMutation.isError ? (
        <Alert severity="error">
          {extractApiError(clearCartMutation.error, "طھط¹ط°ط± طھظپط±ظٹط؛ ط§ظ„ط³ظ„ط©.")}
        </Alert>
      ) : null}

      {clearCartMutation.isSuccess ? (
        <Alert severity="success">
          {clearCartMutation.data?.message || "طھظ… طھظپط±ظٹط؛ ط§ظ„ط³ظ„ط© ط¨ظ†ط¬ط§ط­."}
        </Alert>
      ) : null}

      <SurfaceCard className="page-cart__hero">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">ط§ظ„ط³ظ„ط©</span>
            <Typography variant="h2">ط³ظ„ط© {store.name}</Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppButton component={RouterLink} to={`/market/${slug}`} variant="outlined">
              ظ…طھط§ط¨ط¹ط© ط§ظ„طھط³ظˆظ‚
            </AppButton>
            <AppButton
              variant="text"
              appearance="ghost"
              onClick={() =>
                clearCartMutation.mutate({ debugSource: "customer-cart-page-hero" })
              }
              disabled={clearCartMutation.isPending || !cart.items.length}
            >
              طھظپط±ظٹط؛ ط§ظ„ط³ظ„ط©
            </AppButton>
          </Stack>
        </Box>
      </SurfaceCard>

      {cartQuery.isLoading ? (
        <EmptyState title="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¹ظ†ط§طµط± ط§ظ„ط³ظ„ط©..." />
      ) : !cart.items.length ? (
        <EmptyState
          title="ط§ظ„ط³ظ„ط© ظپط§ط±ط؛ط©"
          description="ط§ط¨ط¯ط£ ظ…ظ† طµظپط­ط© ط§ظ„ظ…طھط¬ط± ظˆط£ط¶ظپ ط§ظ„ظ…ظ†طھط¬ط§طھ ط§ظ„طھظٹ طھط±ظٹط¯ظ‡ط§ ط«ظ… ط¹ط¯ ظ‡ظ†ط§ ظ„ظ„ظ…ط±ط§ط¬ط¹ط©."
          action={
            <AppButton component={RouterLink} to={`/market/${slug}`} variant="contained">
              ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ ط§ظ„ظ…طھط¬ط±
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
                          <span>ط§ظ„ط³ط¹ط±</span>
                          <strong>{formatCurrency(row.unitPrice)}</strong>
                        </Box>
                        <Box className="page-cart__item-stat">
                          <span>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</span>
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
                          ط­ط°ظپ
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
                      title: "ط§ظ„ظ…ظ†طھط¬",
                      render: (row) => <CartItem item={row} storeSlug={slug} />,
                    },
                    {
                      key: "price",
                      title: "ط§ظ„ط³ط¹ط±",
                      render: (row) => formatCurrency(row.unitPrice),
                    },
                    {
                      key: "quantity",
                      title: "ط§ظ„ظƒظ…ظٹط©",
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
                      title: "ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ",
                      render: (row) => formatCurrency(row.totalPrice),
                    },
                    {
                      key: "actions",
                      title: "ط¥ط¬ط±ط§ط،",
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
                          ط­ط°ظپ
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
