import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import useStoreBySlug from "../../hooks/stores/useStoreBySlug.js";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useCustomerProfile, { customerProfileKey, customerProfileUrl } from "../../hooks/auth/useCustomerProfile.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import { buildStorefrontPath } from "../../utils/customDomain.js";
import useAuthStore from "../../store/authStore.js";
import { getStorefrontSessionState } from "../../utils/storefrontSession.js";
import axiosInstance from "../../API/axiosInstance.js";
import extractApiError from "../../utils/extractApiError.js";

function ProfileForm({ profile, t }) {
  const client = useQueryClient();
  const [form, setForm] = useState(() => ({ firstName: profile.firstName || "", lastName: profile.lastName || "", phone: profile.phone || "", address: profile.address || "", city: profile.city || "" }));
  const mutation = useMutation({ mutationFn: async () => (await axiosInstance.put(customerProfileUrl(profile.storeId), form)).data,
    onSuccess: (data) => {
      client.setQueryData(customerProfileKey(profile.storeId, profile.id), data);
      const scope = getStorefrontSessionState(profile.storeId);
      if (scope.storefrontCustomer?.id === profile.id) {
        const session = scope.storefrontSession;
        useAuthStore.getState().setStorefrontSession({ ...session, storeId: profile.storeId, user: { ...session.user, ...data } });
      }
    } });
  return <Stack component="form" spacing={3} onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
    {mutation.isError && <Alert severity="error">{extractApiError(mutation.error, t("تعذر حفظ المعلومات"))}</Alert>}
    {mutation.isSuccess && <Alert severity="success">{t("تم تحديث معلوماتك بنجاح")}</Alert>}
    <TextField label={t("البريد الإلكتروني")} value={profile.email} slotProps={{ input: { readOnly: true } }} />
    {[["firstName", "الاسم الأول", 100], ["lastName", "اسم العائلة", 100], ["phone", "رقم الهاتف", 50], ["address", "عنوان التوصيل", 300], ["city", "المدينة", 100]].map(([key, label, maxLength]) =>
      <TextField key={key} label={t(label)} value={form[key]} required={key === "firstName" || key === "lastName"} type={key === "phone" ? "tel" : "text"}
        disabled={mutation.isPending} slotProps={{ htmlInput: { maxLength } }} onChange={(e) => { mutation.reset(); setForm((v) => ({ ...v, [key]: e.target.value })); }} />)}
    <Button variant="contained" type="submit" disabled={mutation.isPending}>{t(mutation.isPending ? "جارٍ الحفظ…" : "حفظ المعلومات")}</Button>
  </Stack>;
}

export default function Profile() {
  const { slug } = useParams();
  const { t, language } = useStorefrontLanguage();
  const storeQuery = useStoreBySlug(slug, { language });
  const store = normalizeEntityResponse(storeQuery.data);
  const session = useStorefrontSession(store?.id, store?.slug || slug);
  const profile = useCustomerProfile(store?.id, session.hasScopedStorefrontSession);
  if (storeQuery.isLoading) return <Typography>{t("جارٍ التحميل…")}</Typography>;
  if (!store || storeQuery.isError) return <Alert severity="error">{t("تعذر تحميل المتجر")}</Alert>;
  return <Box className="storefront-page" sx={{ maxWidth: 640, mx: "auto", py: 6 }}>
    <Typography variant="h4" sx={{ mb: 4 }}>{t("الملف الشخصي")}</Typography>
    {!session.hasScopedStorefrontSession ? <Alert severity="info">{t("سجل الدخول لهذا المتجر لتحديث معلوماتك")} <Button component={RouterLink} to={buildStorefrontPath(store.slug, "/login")} state={{ redirectTo: buildStorefrontPath(store.slug, "/profile"), storeId: store.id, storeSlug: store.slug }}>{t("تسجيل الدخول")}</Button></Alert>
      : profile.isPending ? <Typography>{t("جارٍ التحميل…")}</Typography>
        : profile.isError ? <Alert severity="error">{extractApiError(profile.error, t("تعذر تحميل معلوماتك"))}<Button onClick={() => profile.refetch()}>{t("إعادة المحاولة")}</Button></Alert>
          : <ProfileForm key={`${store.id}:${profile.data.id}`} profile={profile.data} t={t} />}
  </Box>;
}
