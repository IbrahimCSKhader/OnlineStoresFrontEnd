import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Paper, Stack, Typography } from "@mui/material";
import AppButton from "../common/buttons/AppButton.jsx";
import AppTextField from "../common/inputs/AppTextField.jsx";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import storeApi from "../../API/store.api.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function DeliveryLocationsForm({ store }) {
  const { t } = useOwnerLanguage();
  const queryClient = useQueryClient();
  const [locations, setLocations] = useState(() => store.deliveryLocations || []);
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: () => storeApi.updateStore(store.id, {
      deliveryLocations: locations.map(({ id, name, cost }) => ({
        ...(id ? { id } : {}), name: name.trim(), cost: Number(cost),
      })),
    }),
    onSuccess: async (response) => {
      setLocations(normalizeEntityResponse(response)?.deliveryLocations || []);
      await queryClient.invalidateQueries({ queryKey: queryKeys.stores.all });
      setSaved(true);
    },
  });
  const change = (index, key, value) => {
    setSaved(false);
    setLocations((current) => current.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };
  return (
    <Paper className="owner-panel" elevation={0} sx={{ p: 3 }}>
      <Stack component="form" spacing={2} onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}>
        <Typography variant="h5">{t("خيارات التوصيل")}</Typography>
        <Typography color="text.secondary">{t("أضف أماكن التوصيل وكلفة كل مكان. بدون أماكن مضافة، يكون التوصيل افتراضيًا ومجانيًا.")}</Typography>
        {locations.map((location, index) => (
          <Stack key={location.id || `new-${index}`} direction={{ xs: "column", sm: "row" }} spacing={2}>
            <AppTextField label={t("مكان التوصيل")} required value={location.name}
              slotProps={{ htmlInput: { maxLength: 100 } }} disabled={mutation.isPending}
              onChange={(event) => change(index, "name", event.target.value)} />
            <AppTextField label={t("كلفة التوصيل")} required type="number" value={location.cost}
              slotProps={{ htmlInput: { min: 0, max: 99999999.99, step: 0.01 } }} disabled={mutation.isPending}
              onChange={(event) => change(index, "cost", event.target.value)} />
            <AppButton color="error" disabled={mutation.isPending} onClick={() => {
              setSaved(false);
              setLocations((current) => current.filter((_, i) => i !== index));
            }}>{t("حذف")}</AppButton>
          </Stack>
        ))}
        {mutation.error ? <Alert severity="error">{extractApiError(mutation.error)}</Alert> : null}
        {saved ? <Alert severity="success">{t("تم حفظ خيارات التوصيل")}</Alert> : null}
        <Stack direction="row" spacing={2}>
          <AppButton variant="outlined" disabled={mutation.isPending || locations.length >= 50} onClick={() => {
            setSaved(false);
            setLocations((current) => [...current, { name: "", cost: "" }]);
          }}>{t("إضافة مكان توصيل")}</AppButton>
          <AppButton type="submit" variant="contained" disabled={mutation.isPending}>
            {t(mutation.isPending ? "جارٍ الحفظ..." : "حفظ خيارات التوصيل")}
          </AppButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
