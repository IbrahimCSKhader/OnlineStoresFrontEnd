import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import AppTextField from "../common/inputs/AppTextField.jsx";
import "./CheckoutForm.css";

const checkoutSteps = ["بيانات الطلب", "المراجعة"];

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
              label="عنوان التوصيل"
              value={form.deliveryAddress}
              onChange={(event) => onChange("deliveryAddress", event.target.value)}
              multiline
              minRows={3}
            />
            <AppTextField
              label="المدينة"
              value={form.deliveryCity}
              onChange={(event) => onChange("deliveryCity", event.target.value)}
            />
            <AppTextField
              label="رقم الهاتف"
              value={form.deliveryPhone}
              onChange={(event) => onChange("deliveryPhone", event.target.value)}
            />
            <AppTextField
              label="كود الخصم (اختياري)"
              value={form.couponCode}
              onChange={(event) => onChange("couponCode", event.target.value)}
            />
            <AppTextField
              label="ملاحظات الطلب"
              value={form.customerNotes}
              onChange={(event) => onChange("customerNotes", event.target.value)}
              multiline
              minRows={4}
            />
          </Box>
        ) : null}

        {step === 1 ? (
          <Box className="checkout-form__review">
            <Typography variant="h6">مراجعة البيانات</Typography>
            <Box className="checkout-form__review-grid">
              <div>
                <span>العنوان</span>
                <strong>{form.deliveryAddress || "-"}</strong>
              </div>
              <div>
                <span>المدينة</span>
                <strong>{form.deliveryCity || "-"}</strong>
              </div>
              <div>
                <span>رقم الهاتف</span>
                <strong>{form.deliveryPhone || "-"}</strong>
              </div>
              <div>
                <span>كود الخصم</span>
                <strong>{form.couponCode || "-"}</strong>
              </div>
              <div>
                <span>الملاحظات</span>
                <strong>{form.customerNotes || "-"}</strong>
              </div>
            </Box>
            <Typography variant="body2" color="text.secondary">
              عند التأكيد سيتم إنشاء الطلب من السلة الحالية في نفس المتجر ثم إرسال ملخصه عبر واتساب.
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
