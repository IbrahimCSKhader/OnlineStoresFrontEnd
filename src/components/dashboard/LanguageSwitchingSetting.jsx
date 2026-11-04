import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, FormControlLabel, Paper, Stack, Switch, Typography } from "@mui/material";
import storeApi from "../../API/store.api.js";
import useOwnerLanguage from "../../hooks/storefront/useOwnerLanguage.js";
import extractApiError from "../../utils/extractApiError.js";

export default function LanguageSwitchingSetting({ store }) {
  const { t } = useOwnerLanguage();
  const client = useQueryClient();
  const [enabled, setEnabled] = useState(store.enableLanguageSwitching === true);
  const mutation = useMutation({ mutationFn: () => storeApi.updateStore(store.id, { enableLanguageSwitching: enabled }),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: ["stores"] }),
      client.invalidateQueries({ queryKey: ["storefront-language"] }),
      client.removeQueries({ queryKey: ["storefront-language-selection"] }),
    ]) });
  return <Paper className="owner-panel" elevation={0} sx={{ p: 4 }}>
    <Stack spacing={2}>
      <Typography variant="h6">{t("تحويل اللغة")}</Typography>
      <FormControlLabel label={t("تفعيل تبديل اللغة للزوار")} control={<Switch checked={enabled} disabled={mutation.isPending} onChange={(e) => { mutation.reset(); setEnabled(e.target.checked); }} />} />
      <Typography color="text.secondary">{t(enabled ? "يظهر خيار تبديل اللغة للزوار، وتبدأ الواجهة بلغة تسجيل المتجر." : "يختفي خيار تبديل اللغة وتظهر الواجهة بلغة تسجيل المتجر فقط.")}</Typography>
      {mutation.isError && <Alert severity="error">{extractApiError(mutation.error, t("تعذر حفظ الإعداد"))}</Alert>}
      {mutation.isSuccess && <Alert severity="success">{t("تم حفظ الإعداد")}</Alert>}
      <Button variant="contained" disabled={mutation.isPending || enabled === (store.enableLanguageSwitching === true)} onClick={() => mutation.mutate()}>{t("حفظ إعداد اللغة")}</Button>
    </Stack>
  </Paper>;
}
