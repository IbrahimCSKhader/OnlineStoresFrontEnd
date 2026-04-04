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
import useCart from "../../hooks/cart/useCart.js";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useAuth from "../../hooks/auth/useAuth.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { normalizeCartResponse } from "../../utils/storefront.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { buildStoreCustomerAuthState } from "../../utils/storeCustomerAuth.js";
import { normalizeWhatsAppIdentifier } from "../../utils/storeContacts.js";
import useStoreBranding from "../../theme/useStoreBranding.js";
import "./Checkout.css";

const initialForm = {
  fullName: "",
  address: "",
  couponCode: "",
  notes: "",
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

  // Fallback: inspect first-level keys case-insensitively.
  const entries = Object.entries(store);
  const looseMatch = entries.find(([key, value]) => {
    if (value === undefined || value === null || !String(value).trim())
      return false;
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

  // Fallback: nested contact object if present.
  const contact = store.contact || store.contacts || store.ownerContact;
  if (contact && typeof contact === "object") {
    return findStoreWhatsAppNumber(contact);
  }

  return "";
}

function buildWhatsAppUrl(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
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

  const lines = [
    "طلب جديد",
    `المتجر: ${store.name || "-"}`,
    "",
    "بيانات العميل:",
    `• الاسم: ${form.fullName || "-"}`,
    `• العنوان: ${form.address || "-"}`,
    "",
    "تفاصيل الطلب:",
    ...orderItems,
    "",
    "الملخص:",
    `• إجمالي العناصر: ${cart.itemCount}`,
    `• الإجمالي النهائي: ${formatCurrency(cart.totalAmount)}`,
    `• كود الخصم: ${form.couponCode || "-"}`,
    `• ملاحظات: ${form.notes || "-"}`,
  ];

  return lines.join("\n");
}

export default function Checkout() {
  const { slug } = useParams();
  const { isStoreCustomer } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState("");

  const storeQuery = useStoreBySlug(slug);
  const store = useMemo(
    () => normalizeEntityResponse(storeQuery.data),
    [storeQuery.data],
  );

  useStoreBranding(store);

  const cartQuery = useCart(store?.id, {
    enabled: Boolean(store?.id),
  });
  const cart = normalizeCartResponse(cartQuery.data);
  const storeCustomerAuthState = store?.id
    ? buildStoreCustomerAuthState({
        storeId: store.id,
        storeSlug: slug,
        storeName: store.name,
        redirectTo: `/market/${slug}/checkout`,
      })
    : undefined;

  if (storeQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState title="جاري تحميل صفحة الدفع..." />
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

  if (!cart.items.length && !cartQuery.isLoading) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title="لا يمكن المتابعة دون منتجات"
          description="أضف منتجًا واحدًا على الأقل إلى السلة قبل إرسال الطلب عبر واتساب."
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

  if (!isStoreCustomer) {
    return (
      <Box className="storefront-page page-checkout">
        <EmptyState
          title="سجل كعميل متجر لإرسال الطلب"
          description="السلة محفوظة لك. بعد تسجيل الدخول أو إنشاء حساب داخل هذا المتجر سنربطها بحسابك ونكمل الطلب مباشرة."
          action={
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
              <AppButton
                component={RouterLink}
                to={`/market/${slug}/login`}
                state={storeCustomerAuthState}
                variant="contained"
              >
                تسجيل الدخول
              </AppButton>
              <AppButton
                component={RouterLink}
                to={`/market/${slug}/register`}
                state={storeCustomerAuthState}
                variant="outlined"
              >
                إنشاء حساب
              </AppButton>
            </Box>
          }
        />
      </Box>
    );
  }

  const handleSubmitOrder = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    if (!String(form.fullName || "").trim()) {
      setSubmitError("يرجى إدخال الاسم الكامل قبل إرسال الطلب.");
      return;
    }

    if (!String(form.address || "").trim()) {
      setSubmitError("يرجى إدخال العنوان قبل إرسال الطلب.");
      return;
    }

    const rawWhatsAppNumber = findStoreWhatsAppNumber(store);
    const waNumber = normalizeWhatsAppIdentifier(rawWhatsAppNumber);

    if (!waNumber) {
      setSubmitError(
        "لا يوجد رقم واتساب صالح لصاحب المتجر حاليًا. تحقق أن المتجر يحتوي حقل رقم مثل WhatsAppNumber أو whatsAppNumber.",
      );
      return;
    }

    if (waNumber.length < 10) {
      setSubmitError(`رقم واتساب غير صالح: ${rawWhatsAppNumber}`);
      return;
    }

    const message = buildWhatsAppOrderMessage({ store, cart, form });
    const whatsappUrl = buildWhatsAppUrl(waNumber, message);
    // Debug: print the generated WhatsApp URL to browser console.
    console.log("[Checkout] WhatsApp URL:", whatsappUrl);

    setLastWhatsAppUrl(whatsappUrl);
    window.location.href = whatsappUrl;

    setSubmitSuccess(
      `تم تجهيز الطلب وفتح واتساب لإرساله إلى صاحب المتجر (الرقم: ${waNumber}).`,
    );
  };

  return (
    <Box className="storefront-page page-checkout">
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
      {submitSuccess ? <Alert severity="success">{submitSuccess}</Alert> : null}

      <SurfaceCard className="page-checkout__hero">
        <Box className="storefront-section__head">
          <Box className="storefront-section__copy">
            <span className="storefront-eyebrow">Checkout</span>
            <Typography variant="h2">
              إرسال الطلب عبر واتساب - {store.name}
            </Typography>
            <Typography variant="body1" className="storefront-subtitle">
              في هذا الفلو لن يتم إنشاء Order على السيرفر، فقط تجهيز الطلب
              وإرساله عبر رابط واتساب.
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

      {lastWhatsAppUrl ? (
        <Alert severity="info">
          إذا لم يفتح واتساب تلقائيًا يمكنك فتح الرابط يدويًا:
          <br />
          <a href={lastWhatsAppUrl} target="_blank" rel="noreferrer">
            {lastWhatsAppUrl}
          </a>
        </Alert>
      ) : null}

      <Box className="storefront-grid">
        <Box className="storefront-grid__span-8">
          <SurfaceCard className="page-checkout__form-card">
            <CheckoutForm
              step={step}
              form={form}
              isSubmitting={false}
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


