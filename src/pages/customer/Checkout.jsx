import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import CartItem from "../../components/cart/CartItem.jsx";
import CartSummary from "../../components/cart/CartSummary.jsx";
import CheckoutForm from "../../components/order/CheckoutForm.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useCart from "../../hooks/cart/useCart.js";
import useClearCart from "../../hooks/cart/useClearCart.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import useCreateOrder from "../../hooks/orders/useCreateOrder.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import {
  buildOrderCartActor,
  getCartDebugSummary,
  logOrderCartFlow,
  serializeOrderCartError,
} from "../../utils/orderCartDebug.js";
import { normalizeOrderDetails } from "../../utils/orders.js";
import { getOrderStatusLabel, ORDER_STATUS } from "../../utils/orderStatus.js";
import { buildStoreCustomerAuthState } from "../../utils/storeCustomerAuth.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import { normalizeWhatsAppIdentifier } from "../../utils/storeContacts.js";
import { buildWhatsAppLink } from "../../utils/whatsapp.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./Checkout.css";

const initialForm = {
  deliveryAddress: "",
  deliveryCity: "",
  deliveryPhone: "",
  couponCode: "",
  customerNotes: "",
};

function findStoreWhatsAppNumber(store) {
  if (!store || typeof store !== "object") return "";

  const directCandidates = [
    store.whatsAppNumber,
    store.whatsappNumber,
    store.WhatsAppNumber,
    store.whatsapp,
    store.whatsApp,
    store.phoneNumber,
    store.phone,
    store.mobile,
    store.mobileNumber,
  ];

  const firstDirect = directCandidates.find(
    (value) => value !== undefined && value !== null && String(value).trim(),
  );

  if (firstDirect) {
    return String(firstDirect);
  }

  const looseMatch = Object.entries(store).find(([key, value]) => {
    if (value === undefined || value === null || !String(value).trim()) {
      return false;
    }

    const normalizedKey = key.toLowerCase();
    return (
      normalizedKey.includes("whatsapp") ||
      normalizedKey.includes("whats_app") ||
      normalizedKey === "phone" ||
      normalizedKey === "phonenumber" ||
      normalizedKey.includes("mobile")
    );
  });

  if (looseMatch) {
    return String(looseMatch[1]);
  }

  const contact = store.contact || store.contacts || store.ownerContact;
  if (contact && typeof contact === "object") {
    return findStoreWhatsAppNumber(contact);
  }

  return "";
}

function buildCouponDiscountLabel(order, couponCode, t) {
  const discountType = order.couponDiscountType;
  const discountValue = Number(order.couponDiscountValue ?? 0) || 0;

  if (!couponCode) {
    return "";
  }

  if (discountType === 0 && discountValue > 0) {
    return t("- خصم {0}% على كوبون {1}", discountValue, couponCode);
  }

  if (discountType === 1 && discountValue > 0) {
    return t("- خصم {0} على كوبون {1}", formatCurrency(discountValue), couponCode);
  }

  return t("- تم تطبيق كوبون الخصم: {0}", couponCode);
}

function buildWhatsAppOrderMessage({ store, cart, form, order, t }) {
  const normalizedOrder = normalizeOrderDetails(order);
  const normalizedItems = normalizedOrder.items.length
    ? normalizedOrder.items
    : cart.items.map((item, index) => ({
        productName:
          item.name ||
          item.productName ||
          item.raw?.productName ||
          item.raw?.product?.name ||
          t("منتج #{0}", index + 1),
        variantName: item.variantName || "",
        variantSku: item.variantSku || "",
        variantAttributes: item.variantAttributes || "",
        quantity: Number(item.quantity ?? 1) || 1,
        unitPrice: Number(item.unitPrice ?? 0) || 0,
        totalPrice:
          Number(
            item.totalPrice ??
              ((Number(item.unitPrice ?? 0) || 0) * (Number(item.quantity ?? 1) || 1)),
          ) || 0,
      }));
  const subtotal =
    normalizedOrder.subtotal ||
    cart.subtotal ||
    normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const finalTotal =
    normalizedOrder.totalAmount ||
    normalizedOrder.finalTotal ||
    cart.totalAmount ||
    Math.max(subtotal, 0);
  const discountAmount =
    normalizedOrder.discount || Math.max(subtotal - finalTotal, 0);
  const couponCode = String(
    normalizedOrder.couponCode || form.couponCode || "",
  ).trim();
  const customerDiscountPercentage =
    Number(normalizedOrder.customerDiscountPercentage ?? 0) || 0;
  const couponDiscountLabel = buildCouponDiscountLabel(normalizedOrder, couponCode, t);

  const orderItems = normalizedItems.map((item, index) => {
    const variantDetails = [
      item.variantName,
      item.variantAttributes,
      item.variantSku ? `SKU: ${item.variantSku}` : "",
    ].filter(Boolean);
    const variantLabel = variantDetails.length ? ` (${variantDetails.join("، ")})` : "";

    return [
      `- ${index + 1}. ${item.productName}${variantLabel}`,
      t("الكمية: {0}", item.quantity),
      t("سعر الوحدة: {0}", formatCurrency(item.unitPrice)),
      t("الإجمالي: {0}", formatCurrency(item.totalPrice)),
    ].join("\n");
  });

  const pricingLines = [
    t("- السعر قبل الخصم: {0}", formatCurrency(subtotal)),
    t("- إجمالي الخصومات: {0}", formatCurrency(discountAmount)),
    t("- الإجمالي النهائي: {0}", formatCurrency(finalTotal)),
  ];

  if (customerDiscountPercentage > 0) {
    pricingLines.push(t("- تم خصم {0}% لزبون متجر", customerDiscountPercentage));
  }

  if (couponDiscountLabel) {
    pricingLines.push(couponDiscountLabel);
  }

  return [
    t("طلب جديد"),
    t("المتجر: {0}", store.name || "-"),
    t("رقم الطلب: {0}", normalizedOrder.orderNumber || normalizedOrder.id || "-"),
    "",
    t("بيانات التوصيل:"),
    t("- العنوان: {0}", normalizedOrder.deliveryAddress || form.deliveryAddress || "-"),
    t("- المدينة: {0}", normalizedOrder.deliveryCity || form.deliveryCity || "-"),
    t("- رقم الهاتف: {0}", normalizedOrder.deliveryPhone || form.deliveryPhone || "-"),
    "",
    t("تفاصيل الطلب:"),
    ...orderItems,
    "",
    t("الملخص:"),
    t("- إجمالي العناصر: {0}", normalizedOrder.itemsCount || cart.itemCount),
    ...pricingLines,
    t("- ملاحظات: {0}", normalizedOrder.customerNotes || form.customerNotes || "-"),
  ].join("\n");
}

function openPendingWhatsAppWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  const popup = window.open("", "_blank");

  if (!popup) {
    return null;
  }

  try {
    popup.document.title = "Preparing WhatsApp";
    popup.document.body.innerHTML =
      "<p style='font-family: sans-serif; padding: 24px;'>Preparing WhatsApp...</p>";
  } catch {
    // Ignore document access issues and keep the popup as a plain blank tab.
  }

  return popup;
}

function closePendingWhatsAppWindow(popup) {
  if (!popup || popup.closed) {
    return;
  }

  try {
    popup.close();
  } catch {
    // Ignore close failures.
  }
}

function redirectToWhatsApp(url, popup) {
  if (!url || typeof window === "undefined") {
    closePendingWhatsAppWindow(popup);
    return;
  }

  if (popup && !popup.closed) {
    try {
      popup.location.replace(url);
      popup.focus?.();
      return;
    } catch {
      // Fall back to same-tab navigation below.
    }
  }

  window.location.assign(url);
}

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const { storeCustomer } = auth;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const { t, language } = useStorefrontLanguage();

  const storeQuery = useStoreBySlug(slug, { language });
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const resolvedStoreSlug = store?.slug || slug || "";
  const storeHomePath = buildStorefrontPath(resolvedStoreSlug);
  const storeLoginPath = buildStorefrontPath(resolvedStoreSlug, "/login");
  const storeCartPath = buildStorefrontPath(resolvedStoreSlug, "/cart");
  const storeCheckoutPath = buildStorefrontPath(resolvedStoreSlug, "/checkout");

  const cartQuery = useCart(store?.id, {
    enabled: Boolean(store?.id),
  });
  const storefrontSession = useStorefrontSession(store?.id, resolvedStoreSlug);
  const createOrderMutation = useCreateOrder(store?.id);
  const clearCartMutation = useClearCart(store?.id);
  const cart = normalizeCartResponse(cartQuery.data);
  const activeStoreCustomer = storefrontSession.hasScopedStorefrontSession
    ? storeCustomer || storefrontSession.storefrontCustomer
    : null;

  const actor = buildOrderCartActor({
    auth,
    storefrontSession,
    storeId: store?.id,
    slug: resolvedStoreSlug,
  });

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState title={t("جارٍ تحميل صفحة الدفع...")} />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title={t("تعذر فتح صفحة الدفع")}
          description={t("تعذر العثور على المتجر المطلوب.")}
        />
      </Box>
    );
  }

  if (storefrontSession.hasConflictingStoreCustomerSession) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title={t("يلزم تسجيل الدخول لهذا المتجر")}
          description={t("جلسة العميل الحالية تخص متجرًا آخر، لذلك سيُرفض الطلب هنا.")}
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

  if (!cart.items.length && !cartQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title={t("لا يمكن المتابعة دون منتجات")}
          description={t("أضف منتجًا واحدًا على الأقل إلى السلة قبل إرسال الطلب.")}
          action={
            <AppButton
              component={RouterLink}
              to={storeHomePath}
              variant="contained"
            >{t("العودة إلى المتجر")}</AppButton>
          }
        />
      </Box>
    );
  }

  const redirectToStoreLogin = () => {
    navigate(storeLoginPath, {
      state: buildStoreCustomerAuthState({
        storeId: store?.id,
        storeSlug: resolvedStoreSlug,
        storeName: store?.name,
        redirectTo: storeCheckoutPath,
      }),
    });
  };

  const handleValidationFailure = (reason, message, extra = {}) => {
    logOrderCartFlow("Checkout Validation Failed", {
      status: "validation-failed",
      source: "customer-checkout-page",
      reason,
      actor,
      cart: getCartDebugSummary(cart),
      ...extra,
    });
    setSubmitError(message);
  };

  const handleSubmitOrder = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    logOrderCartFlow("Checkout Submit Triggered", {
      status: "started",
      source: "customer-checkout-page",
      actor,
      cart: getCartDebugSummary(cart),
      checkoutForm: {
        deliveryAddress: String(form.deliveryAddress || "").trim(),
        deliveryCity: String(form.deliveryCity || "").trim(),
        deliveryPhone: String(form.deliveryPhone || "").trim(),
        couponCode: String(form.couponCode || "").trim(),
        customerNotes: String(form.customerNotes || "").trim(),
      },
    });

    if (!activeStoreCustomer || !storefrontSession.hasScopedStorefrontSession) {
      redirectToStoreLogin();
      return;
    }

    if (!String(form.deliveryAddress || "").trim()) {
      handleValidationFailure(
        "missing-delivery-address",
        t("يرجى إدخال عنوان التوصيل قبل إرسال الطلب."),
      );
      return;
    }

    if (!String(form.deliveryCity || "").trim()) {
      handleValidationFailure(
        "missing-delivery-city",
        t("يرجى إدخال المدينة قبل إرسال الطلب."),
      );
      return;
    }

    if (!String(form.deliveryPhone || "").trim()) {
      handleValidationFailure(
        "missing-delivery-phone",
        t("يرجى إدخال رقم الهاتف قبل إرسال الطلب."),
      );
      return;
    }

    const rawWhatsAppNumber = findStoreWhatsAppNumber(store);
    const waNumber = normalizeWhatsAppIdentifier(rawWhatsAppNumber);

    if (!waNumber) {
      handleValidationFailure(
        "missing-store-whatsapp-number",
        t("لا يوجد رقم واتساب صالح لصاحب المتجر حاليًا. تحقق من بيانات التواصل في المتجر."),
        {
          rawWhatsAppNumber,
        },
      );
      return;
    }

    let whatsappUrl = buildWhatsAppLink(
      waNumber,
      buildWhatsAppOrderMessage({ store, cart, form, t }),
    );

    if (!whatsappUrl) {
      handleValidationFailure(
        "failed-to-build-whatsapp-url",
        t("تعذر تجهيز رابط واتساب لهذا الرقم: {0}", rawWhatsAppNumber),
        {
          rawWhatsAppNumber,
          normalizedWhatsAppNumber: waNumber,
        },
      );
      return;
    }

    logOrderCartFlow("Checkout WhatsApp Prepared", {
      status: "ready",
      source: "customer-checkout-page",
      actor,
      rawWhatsAppNumber,
      normalizedWhatsAppNumber: waNumber,
      whatsappUrl,
    });

    const pendingWhatsAppWindow = openPendingWhatsAppWindow();
    const payload = {
      storeId: store?.id,
      deliveryAddress: String(form.deliveryAddress || "").trim(),
      deliveryCity: String(form.deliveryCity || "").trim(),
      deliveryPhone: String(form.deliveryPhone || "").trim(),
      customerNotes: String(form.customerNotes || "").trim() || undefined,
      couponCode: String(form.couponCode || "").trim() || undefined,
      debugSource: "customer-checkout-page",
    };

    let orderResponse = null;

    try {
      orderResponse = await createOrderMutation.mutateAsync(payload);
    } catch (error) {
      closePendingWhatsAppWindow(pendingWhatsAppWindow);

      logOrderCartFlow("Checkout Order Create Failed", {
        status: "failed",
        source: "customer-checkout-page",
        actor,
        cart: getCartDebugSummary(cart),
        error: serializeOrderCartError(error),
      });

      if (error?.response?.status === 401) {
        redirectToStoreLogin();
        return;
      }

      if (error?.response?.status === 403) {
        setSubmitError(
          extractApiError(
            error,
            t("تم رفض الطلب لأن جلسة العميل الحالية لا تخص هذا المتجر."),
          ),
        );
        return;
      }

      setSubmitError(
        extractApiError(
          error,
          t("تعذر إنشاء الطلب. تحقق من كود الخصم وبيانات التوصيل وتوفر المخزون."),
        ),
      );
      return;
    }

    logOrderCartFlow("Checkout Order Create Completed", {
      status: "success",
      source: "customer-checkout-page",
      actor,
      cart: getCartDebugSummary(cart),
      orderResponse,
    });

    const normalizedOrder = normalizeOrderDetails(orderResponse);
    whatsappUrl = buildWhatsAppLink(
      waNumber,
      buildWhatsAppOrderMessage({
        t,
        store,
        order: normalizedOrder,
        cart,
        form,
      }),
    );

    if (!whatsappUrl) {
      closePendingWhatsAppWindow(pendingWhatsAppWindow);
      handleValidationFailure(
        "failed-to-build-whatsapp-url",
        t("تعذر تجهيز رابط واتساب لهذا الرقم: {0}", rawWhatsAppNumber),
        {
          rawWhatsAppNumber,
          normalizedWhatsAppNumber: waNumber,
          orderId: normalizedOrder.id,
        },
      );
      return;
    }

    logOrderCartFlow("Checkout WhatsApp Rebuilt After Order", {
      status: "ready",
      source: "customer-checkout-after-order",
      actor,
      rawWhatsAppNumber,
      normalizedWhatsAppNumber: waNumber,
      order: normalizedOrder,
      whatsappUrl,
    });

    try {
      await clearCartMutation.mutateAsync({
        debugSource: "customer-checkout-after-order",
      });
      setSubmitSuccess(
        t("تم إنشاء الطلب ومسح السلة بنجاح. حالة الطلب الآن {0} بانتظار تأكيد صاحب المتجر. سيتم الآن فتح واتساب لإرسال الطلب إلى صاحب المتجر ({1}).", t(getOrderStatusLabel(ORDER_STATUS.PENDING)), waNumber),
      );
    } catch (error) {
      logOrderCartFlow("Checkout Cart Clear Failed After Order", {
        status: "failed",
        source: "customer-checkout-after-order",
        actor,
        error: serializeOrderCartError(error),
      });
      setSubmitSuccess(
        t("تم إنشاء الطلب بنجاح. حالة الطلب الآن {0} بانتظار تأكيد صاحب المتجر. سيتم الآن فتح واتساب لإرسال الطلب إلى صاحب المتجر ({1}).", t(getOrderStatusLabel(ORDER_STATUS.PENDING)), waNumber),
      );
    }

    logOrderCartFlow("Checkout Redirecting To WhatsApp", {
      status: "redirect",
      source: "customer-checkout-page",
      actor,
      normalizedWhatsAppNumber: waNumber,
      whatsappUrl,
    });

    redirectToWhatsApp(whatsappUrl, pendingWhatsAppWindow);
  };

  return (
    <Box className="storefront-page page-checkout">
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      {submitSuccess ? <Alert severity="success">{submitSuccess}</Alert> : null}

      <SurfaceCard className="page-checkout__hero">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">{t("إتمام الطلب")}</span>
            <Typography variant="h2">{t("إرسال الطلب عبر واتساب -")} {store.name}</Typography>
            <Typography variant="body1" className="storefront-subtitle">{t("يمكنك مراجعة السلة كضيف، لكن إرسال الطلب نفسه يتطلب تسجيل الدخول أولًا. بعد إنشاء الطلب ستصبح حالته معلقة حتى يؤكدها صاحب المتجر، ثم سيفتح واتساب مع ملخص واضح للخصومات المطبقة.")}</Typography>
          </Box>

          <AppButton
            component={RouterLink}
            to={storeCartPath}
            variant="outlined"
          >{t("العودة إلى السلة")}</AppButton>
        </Box>
      </SurfaceCard>

      <Box className="storefront-grid">
        <Box className="storefront-grid__span-8">
          <SurfaceCard className="page-checkout__form-card">
            <CheckoutForm
              step={step}
              form={form}
              isSubmitting={createOrderMutation.isPending || clearCartMutation.isPending}
              submitLabel={t("إرسال الطلب عبر واتساب")}
              onChange={(key, value) =>
                setForm((previous) => ({
                  ...previous,
                  [key]: value,
                }))
              }
              onNext={() => setStep((previous) => Math.min(previous + 1, 1))}
              onBack={() => setStep((previous) => Math.max(previous - 1, 0))}
              onSubmit={handleSubmitOrder}
            />
          </SurfaceCard>
        </Box>

        <Box className="storefront-grid__span-4">
          <SurfaceCard className="page-checkout__cart-card">
            <Typography variant="h6">{t("عناصر السلة")}</Typography>
            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} storeSlug={resolvedStoreSlug} />
              ))}
            </Stack>
          </SurfaceCard>

          <CartSummary
            subtotal={cart.subtotal}
            totalAmount={cart.totalAmount}
            itemCount={cart.itemCount}
            checkoutPath={storeCartPath}
            actionLabel={t("مراجعة السلة")}
          />
        </Box>
      </Box>
    </Box>
  );
}
