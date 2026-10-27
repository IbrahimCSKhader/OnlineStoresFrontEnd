import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, FormControlLabel, Paper, Stack, Switch, Typography } from "@mui/material";
import storeApi from "../../API/store.api.js";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import extractApiError from "../../utils/extractApiError.js";

export default function CheckoutLoginSetting({ store }) {
  const { t } = useOwnerLanguage();
  const client = useQueryClient();
  const [required, setRequired] = useState(store.requireCustomerLoginForCheckout !== false);
  const mutation = useMutation({ mutationFn: () => storeApi.updateStore(store.id, { requireCustomerLoginForCheckout: required }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["stores"] }) });
  return <Paper className="owner-panel" elevation={0} sx={{ p: 4 }}>
    <Stack spacing={2}>
      <Typography variant="h6">{t("تسجيل الزبون عند الطلب")}</Typography>
      <FormControlLabel label={t("يشترط تسجيل دخول الزبون لإتمام الطلب")} control={<Switch checked={required} disabled={mutation.isPending} onChange={(e) => { mutation.reset(); setRequired(e.target.checked); }} />} />
      <Typography color="text.secondary">{t(required ? "الزبون بحاجة لحساب في هذا المتجر لإرسال الطلب." : "الزائر يستطيع إدخال بياناته وإرسال الطلب دون حساب، ويظهر كغير مسجل في الطلبات.")}</Typography>
      {mutation.isError && <Alert severity="error">{extractApiError(mutation.error, t("تعذر حفظ الإعداد"))}</Alert>}
      {mutation.isSuccess && <Alert severity="success">{t("تم حفظ الإعداد")}</Alert>}
      <Button variant="contained" disabled={mutation.isPending || required === (store.requireCustomerLoginForCheckout !== false)} onClick={() => mutation.mutate()}>{t("حفظ إعداد تسجيل الزبون")}</Button>
    </Stack>
  </Paper>;
}
