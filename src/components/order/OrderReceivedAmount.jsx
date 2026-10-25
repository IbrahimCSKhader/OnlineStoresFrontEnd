import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AppButton from "../common/buttons/AppButton.jsx";
import AppTextField from "../common/inputs/AppTextField.jsx";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import orderApi from "../../API/order.api.js";
import { queryKeys } from "../../utils/queryKeys.js";
import extractApiError from "../../utils/extractApiError.js";

export default function OrderReceivedAmount({ order, storeId }) {
  const { t, currency } = useOwnerLanguage();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(order.receivedAmount ?? "");
  const [validationError, setValidationError] = useState("");
  useEffect(() => { setValue(order.receivedAmount ?? ""); }, [order.id, order.receivedAmount]);
  const mutation = useMutation({
    mutationFn: (receivedAmount) => orderApi.updateReceivedAmount(order.id, { receivedAmount }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.byStore(storeId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.storeDetail(storeId, order.id) }),
      ]);
    },
  });
  const hasAmount = order.receivedAmount !== null && order.receivedAmount !== undefined;
  const difference = hasAmount ? Math.round((Number(order.totalAmount) - Number(order.receivedAmount)) * 100) / 100 : null;
  const handleSave = (event) => {
    event.preventDefault();
    const amount = String(value).trim() === "" ? null : Number(value);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001)) {
      setValidationError(t("أدخل مبلغاً موجباً أو صفراً، بمنزلتين عشريتين كحد أقصى."));
      return;
    }
    setValidationError("");
    mutation.mutate(amount);
  };

  return (
    <Stack component="form" onSubmit={handleSave} spacing={1.5} sx={{ my: 2 }}>
      <AppTextField
        label={t("مبلغ الاستلام")}
        type="number"
        value={value}
        onChange={(event) => { setValue(event.target.value); setValidationError(""); mutation.reset(); }}
        helperText={t("إجمالي المبلغ الذي استلمته لهذا الطلب. اتركه فارغاً لإلغاء التسجيل.")}
        slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        disabled={mutation.isPending}
        size="small"
      />
      {hasAmount ? (
        <Stack spacing={0.5} role="status">
          <Typography variant="body2">{t("المبلغ المستلم")}: {currency(order.receivedAmount)}</Typography>
          <Typography variant="body2" color={difference > 0 ? "warning.main" : difference < 0 ? "error.main" : "success.main"}>
            {difference > 0 ? `${t("المتبقي")}: ${currency(difference)}`
              : difference < 0 ? `${t("زيادة مستلمة")}: ${currency(-difference)}`
              : t("تم الاستلام بالكامل")}
          </Typography>
        </Stack>
      ) : null}
      {validationError || mutation.error ? <Alert severity="error">{validationError || extractApiError(mutation.error, t("تعذر حفظ مبلغ الاستلام."))}</Alert> : null}
      {mutation.isSuccess ? <Alert severity="success">{t("تم حفظ مبلغ الاستلام.")}</Alert> : null}
      <AppButton type="submit" variant="outlined" size="small" disabled={mutation.isPending}>
        {t(mutation.isPending ? "جارٍ الحفظ..." : "حفظ مبلغ الاستلام")}
      </AppButton>
    </Stack>
  );
}
