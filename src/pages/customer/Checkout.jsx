import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import SurfaceCard from "../../components/common/cards/SurfaceCard.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import CartSummary from "../../components/cart/CartSummary.jsx";
import CheckoutForm from "../../components/order/CheckoutForm.jsx";
import useAuth from "../../hooks/auth/useAuth.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useCart from "../../hooks/cart/useCart.js";
import useClearCart from "../../hooks/cart/useClearCart.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
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

function buildCouponDiscountLabel(order, couponCode) {
  const discountType = order.couponDiscountType;
  const discountValue = Number(order.couponDiscountValue ?? 0) || 0;

  if (!couponCode) {
    return "";
  }

  if (discountType === 0 && discountValue > 0) {
    return `- خصم ${discountValue}% على كوبون ${couponCode}`;
  }

  if (discountType === 1 && discountValue > 0) {
    return `- خصم ${formatCurrency(discountValue)} على كوبون ${couponCode}`;
  }

  return `- تم تطبيق كوبون الخصم: ${couponCode}`;
}

function buildWhatsAppOrderMessage({ store, cart, form, order }) {
  const normalizedOrder = normalizeOrderDetails(order);
  const normalizedItems = normalizedOrder.items.length
    ? normalizedOrder.items
    : cart.items.map((item, index) => ({
        productName:
          item.name ||
          item.productName ||
          item.raw?.productName ||
          item.raw?.product?.name ||
          `منتج #${index + 1}`,
        variantName: item.variantName || "",
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
  const couponDiscountLabel = buildCouponDiscountLabel(normalizedOrder, couponCode);

  const orderItems = normalizedItems.map((item, index) => {
    const variantLabel = item.variantName ? ` (${item.variantName})` : "";

    return [
      `- ${index + 1}. ${item.productName}${variantLabel}`,
      `  الكمية: ${item.quantity}`,
      `  سعر الوحدة: ${formatCurrency(item.unitPrice)}`,
      `  الإجمالي: ${formatCurrency(item.totalPrice)}`,
    ].join("\n");
  });

  const pricingLines = [
    `- السعر قبل الخصم: ${formatCurrency(subtotal)}`,
    `- إجمالي الخصومات: ${formatCurrency(discountAmount)}`,
    `- الإجمالي النهائي: ${formatCurrency(finalTotal)}`,
  ];

  if (customerDiscountPercentage > 0) {
    pricingLines.push(`- تم خصم ${customerDiscountPercentage}% لزبون متجر`);
  }

  if (couponDiscountLabel) {
    pricingLines.push(couponDiscountLabel);
  }

  return [
    "طلب جديد",
    `المتجر: ${store.name || "-"}`,
    `رقم الطلب: ${normalizedOrder.orderNumber || normalizedOrder.id || "-"}`,
    "",
    "بيانات التوصيل:",
    `- العنوان: ${normalizedOrder.deliveryAddress || form.deliveryAddress || "-"}`,
    `- المدينة: ${normalizedOrder.deliveryCity || form.deliveryCity || "-"}`,
    `- رقم الهاتف: ${normalizedOrder.deliveryPhone || form.deliveryPhone || "-"}`,
    "",
    "تفاصيل الطلب:",
    ...orderItems,
    "",
    "الملخص:",
    `- إجمالي العناصر: ${normalizedOrder.itemsCount || cart.itemCount}`,
    ...pricingLines,
    `- ملاحظات: ${normalizedOrder.customerNotes || form.customerNotes || "-"}`,
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

  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const cartQuery = useCart(store?.id, {
    enabled: Boolean(store?.id),
  });
  const storefrontSession = useStorefrontSession(store?.id, slug);
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
    slug,
  });

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState title="جارٍ تحميل صفحة الدفع..." />
      </Box>
    );
  }

  if (storeQuery.error || !store) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title="تعذر فتح صفحة الدفع"
          description="تعذر العثور على المتجر المطلوب."
        />
      </Box>
    );
  }

  if (storefrontSession.hasConflictingStoreCustomerSession) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title="يلزم تسجيل الدخول لهذا المتجر"
          description="جلسة العميل الحالية تخص متجرًا آخر، لذلك سيُرفض الطلب هنا."
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

  if (!cart.items.length && !cartQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title="لا يمكن المتابعة دون منتجات"
          description="أضف منتجًا واحدًا على الأقل إلى السلة قبل إرسال الطلب."
          action={
            <AppButton
              component={RouterLink}
              to={`/market/${slug}`}
              variant="contained"
            >
              العودة إلى المتجر
            </AppButton>
          }
        />
      </Box>
    );
  }

  const redirectToStoreLogin = () => {
    navigate(`/market/${slug}/login`, {
      state: buildStoreCustomerAuthState({
        storeId: store?.id,
        storeSlug: slug,
        storeName: store?.name,
        redirectTo: `/market/${slug}/checkout`,
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
        "يرجى إدخال عنوان التوصيل قبل إرسال الطلب.",
      );
      return;
    }

    if (!String(form.deliveryCity || "").trim()) {
      handleValidationFailure(
        "missing-delivery-city",
        "يرجى إدخال المدينة قبل إرسال الطلب.",
      );
      return;
    }

    if (!String(form.deliveryPhone || "").trim()) {
      handleValidationFailure(
        "missing-delivery-phone",
        "يرجى إدخال رقم الهاتف قبل إرسال الطلب.",
      );
      return;
    }

    const rawWhatsAppNumber = findStoreWhatsAppNumber(store);
    const waNumber = normalizeWhatsAppIdentifier(rawWhatsAppNumber);

    if (!waNumber) {
      handleValidationFailure(
        "missing-store-whatsapp-number",
        "لا يوجد رقم واتساب صالح لصاحب المتجر حاليًا. تحقق من بيانات التواصل في المتجر.",
        {
          rawWhatsAppNumber,
        },
      );
      return;
    }

    let whatsappUrl = buildWhatsAppLink(
      waNumber,
      buildWhatsAppOrderMessage({ store, cart, form }),
    );

    if (!whatsappUrl) {
      handleValidationFailure(
        "failed-to-build-whatsapp-url",
        `تعذر تجهيز رابط واتساب لهذا الرقم: ${rawWhatsAppNumber}`,
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
            "تم رفض الطلب لأن جلسة العميل الحالية لا تخص هذا المتجر.",
          ),
        );
        return;
      }

      setSubmitError(
        extractApiError(
          error,
          "تعذر إنشاء الطلب. تحقق من كود الخصم وبيانات التوصيل وتوفر المخزون.",
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
        `تعذر تجهيز رابط واتساب لهذا الرقم: ${rawWhatsAppNumber}`,
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
        `تم إنشاء الطلب ومسح السلة بنجاح. حالة الطلب الآن ${getOrderStatusLabel(ORDER_STATUS.PENDING)} بانتظار تأكيد صاحب المتجر. سيتم الآن فتح واتساب لإرسال الطلب إلى صاحب المتجر (${waNumber}).`,
      );
    } catch (error) {
      logOrderCartFlow("Checkout Cart Clear Failed After Order", {
        status: "failed",
        source: "customer-checkout-after-order",
        actor,
        error: serializeOrderCartError(error),
      });
      setSubmitSuccess(
        `تم إنشاء الطلب بنجاح. حالة الطلب الآن ${getOrderStatusLabel(ORDER_STATUS.PENDING)} بانتظار تأكيد صاحب المتجر. سيتم الآن فتح واتساب لإرسال الطلب إلى صاحب المتجر (${waNumber}).`,
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
            <span className="storefront-eyebrow">إتمام الطلب</span>
            <Typography variant="h2">إرسال الطلب عبر واتساب - {store.name}</Typography>
            <Typography variant="body1" className="storefront-subtitle">
              يمكنك مراجعة السلة كضيف، لكن إرسال الطلب نفسه يتطلب تسجيل الدخول أولًا.
              بعد إنشاء الطلب ستصبح حالته معلقة حتى يؤكدها صاحب المتجر، ثم سيفتح واتساب مع ملخص واضح للخصومات المطبقة.
            </Typography>
          </Box>

          <AppButton
            component={RouterLink}
            to={`/market/${slug}/cart`}
            variant="outlined"
          >
            العودة إلى السلة
          </AppButton>
        </Box>
      </SurfaceCard>

      <Box className="storefront-grid">
        <Box className="storefront-grid__span-8">
          <SurfaceCard className="page-checkout__form-card">
            <CheckoutForm
              step={step}
              form={form}
              isSubmitting={createOrderMutation.isPending || clearCartMutation.isPending}
              submitLabel="إرسال الطلب عبر واتساب"
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
          <CartSummary
            subtotal={cart.subtotal}
            totalAmount={cart.totalAmount}
            itemCount={cart.itemCount}
            checkoutPath={`/market/${slug}/cart`}
            actionLabel="مراجعة السلة"
          />
        </Box>
      </Box>
    </Box>
  );
}
