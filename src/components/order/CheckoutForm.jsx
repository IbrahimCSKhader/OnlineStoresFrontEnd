import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import AppTextField from "../common/inputs/AppTextField.jsx";
import "./CheckoutForm.css";

const checkoutSteps = ["بيانات العميل", "الشحن والملاحظات", "المراجعة"];

export default function CheckoutForm({
  step,
  form,
  isSubmitting = false,
  submitLabel = "تأكيد الطلب",
  onChange,
  onNext,
  onBack,
  onSubmit,
}) {
  const isLastStep = step === checkoutSteps.length - 1;

  return (
    <Box className="checkout-form">
      <Stepper activeStep={step} alternativeLabel className="checkout-form__steps">
        {checkoutSteps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box className="checkout-form__body">
        {step === 0 ? (
          <Box className="checkout-form__grid">
            <AppTextField
              label="الاسم الكامل"
              value={form.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
            />
            <AppTextField
              label="رقم الهاتف"
              value={form.phone}
              onChange={(event) => onChange("phone", event.target.value)}
            />
            <AppTextField
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
            />
            <AppTextField
              label="المدينة"
              value={form.city}
              onChange={(event) => onChange("city", event.target.value)}
            />
          </Box>
        ) : null}

        {step === 1 ? (
          <Box className="checkout-form__grid">
            <AppTextField
              label="العنوان"
              value={form.address}
              onChange={(event) => onChange("address", event.target.value)}
            />
            <AppTextField
              label="العنوان الإضافي"
              value={form.addressLine2}
              onChange={(event) => onChange("addressLine2", event.target.value)}
            />
            <AppTextField
              label="طريقة الدفع المفضلة"
              value={form.paymentMethod}
              onChange={(event) => onChange("paymentMethod", event.target.value)}
            />
            <AppTextField
              label="كود الخصم (اختياري)"
              value={form.couponCode}
              onChange={(event) => onChange("couponCode", event.target.value)}
            />
            <AppTextField
              label="ملاحظات الطلب"
              value={form.notes}
              onChange={(event) => onChange("notes", event.target.value)}
              multiline
              minRows={4}
            />
          </Box>
        ) : null}

        {step === 2 ? (
          <Box className="checkout-form__review">
            <Typography variant="h6">مراجعة البيانات</Typography>
            <Box className="checkout-form__review-grid">
              <div>
                <span>الاسم</span>
                <strong>{form.fullName || "-"}</strong>
              </div>
              <div>
                <span>الهاتف</span>
                <strong>{form.phone || "-"}</strong>
              </div>
              <div>
                <span>البريد</span>
                <strong>{form.email || "-"}</strong>
              </div>
              <div>
                <span>المدينة</span>
                <strong>{form.city || "-"}</strong>
              </div>
              <div>
                <span>العنوان</span>
                <strong>{form.address || "-"}</strong>
              </div>
              <div>
                <span>كود الخصم</span>
                <strong>{form.couponCode || "-"}</strong>
              </div>
              <div>
                <span>الدفع</span>
                <strong>{form.paymentMethod || "-"}</strong>
              </div>
            </Box>
            <Typography variant="body2" color="text.secondary">
              عند التأكيد سيتم تجهيز رسالة الطلب وإرسالها عبر واتساب لصاحب المتجر.
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Box className="checkout-form__actions">
        <AppButton variant="text" onClick={onBack} disabled={step === 0 || isSubmitting}>
          رجوع
        </AppButton>
        <AppButton
          variant="contained"
          onClick={isLastStep ? onSubmit : onNext}
          disabled={isSubmitting}
        >
          {isLastStep ? (isSubmitting ? "جارٍ التنفيذ..." : submitLabel) : "التالي"}
        </AppButton>
      </Box>
    </Box>
  );
}
