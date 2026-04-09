import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
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

function buildWhatsAppOrderMessage({ store, cart, form }) {
  const orderItems = cart.items.map((item, index) => {
    const productName =
      item.name ||
      item.productName ||
      item.raw?.productName ||
      item.raw?.product?.name ||
      `منتج #${index + 1}`;
    const variantLabel = item.variantName ? ` (${item.variantName})` : "";

    return [
      `• ${index + 1}. ${productName}${variantLabel}`,
      `  الكمية: ${item.quantity}`,
      `  سعر الوحدة: ${formatCurrency(item.unitPrice)}`,
      `  الإجمالي: ${formatCurrency(item.totalPrice)}`,
    ].join("\n");
  });

  return [
    "طلب جديد",
    `المتجر: ${store.name || "-"}`,
    "",
    "بيانات التوصيل:",
    `• العنوان: ${form.deliveryAddress || "-"}`,
    `• المدينة: ${form.deliveryCity || "-"}`,
    `• رقم الهاتف: ${form.deliveryPhone || "-"}`,
    "",
    "تفاصيل الطلب:",
    ...orderItems,
    "",
    "الملخص:",
    `• إجمالي العناصر: ${cart.itemCount}`,
    `• الإجمالي النهائي: ${formatCurrency(cart.totalAmount)}`,
    `• كود الخصم: ${form.couponCode || "-"}`,
    `• ملاحظات: ${form.customerNotes || "-"}`,
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
  const storefrontSession = useStorefrontSession(store?.id);
  const createOrderMutation = useCreateOrder(store?.id);
  const clearCartMutation = useClearCart(store?.id);
  const cart = normalizeCartResponse(cartQuery.data);

  const actor = buildOrderCartActor({
    auth,
    storefrontSession,
    storeId: store?.id,
    slug,
  });

  if (!storeCustomer) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title="يجب تسجيل الدخول أولاً"
          description="لا يمكن إكمال الطلب بدون جلسة StoreCustomer صالحة لهذا المتجر."
          action={
            <AppButton
              component={RouterLink}
              to={`/market/${slug}/login`}
              variant="contained"
            >
              الذهاب لتسجيل الدخول
            </AppButton>
          }
        />
      </Box>
    );
  }

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState title="جارِ تحميل صفحة الدفع..." />
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
          description="جلسة العميل الحالية تخص متجرًا آخر، لذلك سيرفض الباكند الطلب هنا."
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

    if (!storefrontSession.hasScopedStorefrontSession) {
      handleValidationFailure(
        "missing-scoped-storefront-session",
        "جلسة StoreCustomer الحالية لا تخص هذا المتجر. سجّل الدخول من داخل نفس المتجر ثم أعد المحاولة.",
      );
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

    const whatsappUrl = buildWhatsAppLink(
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
        setSubmitError(
          extractApiError(
            error,
            "الطلب رُفض لأن جلسة StoreCustomer غير صالحة أو منتهية. سجّل الدخول مجددًا ثم أعد المحاولة.",
          ),
        );
        return;
      }

      if (error?.response?.status === 403) {
        setSubmitError(
          extractApiError(
            error,
            "الطلب رُفض لأن storeId المرسل لا يطابق المتجر الموجود داخل توكن العميل الحالي.",
          ),
        );
        return;
      }

      setSubmitError(
        extractApiError(
          error,
          "تعذر إنشاء الطلب. تحقق من كود الخصم، وبيانات التوصيل، وأن عناصر السلة تنتمي لنفس المتجر مع توفر المخزون.",
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

    try {
      await clearCartMutation.mutateAsync({
        debugSource: "customer-checkout-after-order",
      });
      setSubmitSuccess(
        `تم إنشاء الطلب ومسح السلة بنجاح. سيتم الآن فتح واتساب لإرسال الطلب إلى صاحب المتجر (${waNumber}).`,
      );
    } catch (error) {
      logOrderCartFlow("Checkout Cart Clear Failed After Order", {
        status: "failed",
        source: "customer-checkout-after-order",
        actor,
        error: serializeOrderCartError(error),
      });
      setSubmitSuccess(
        `تم إنشاء الطلب بنجاح. سيتم الآن فتح واتساب لإرسال الطلب إلى صاحب المتجر (${waNumber}).`,
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
            <span className="storefront-eyebrow">Checkout</span>
            <Typography variant="h2">إرسال الطلب عبر واتساب - {store.name}</Typography>
            <Typography variant="body1" className="storefront-subtitle">
              سيتم إنشاء الطلب على النظام أولًا من السلة الحالية، ثم فتح واتساب لإرسال الملخص
              إلى صاحب المتجر.
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
