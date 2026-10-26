import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import axiosInstance from "../../API/axiosInstance.js";
import { buildThemeProfile, createAppTheme } from "../../theme/themes.js";
import { resolveStoreThemeConfig } from "../../theme/storeThemeConfig.js";
import { APPEARANCE_FIELDS, APPEARANCE_FONTS, buildAppearanceCss, contrastRatio, validAppearanceValue } from "../../theme/storeAppearance.js";
import extractApiError from "../../utils/extractApiError.js";

function AppearancePreview({ store, mode, draft, compact }) {
  const variants = resolveStoreThemeConfig(store).availableVariants;
  const variant = variants.find((v) => buildThemeProfile(v).mode === mode) || variants[0];
  const profile = useMemo(() => buildThemeProfile(variant, draft), [variant, draft]);
  const theme = useMemo(() => createAppTheme(profile), [profile]);
  const css = buildAppearanceCss(draft[mode], ".store-appearance-preview");
  return <ThemeProvider theme={theme}>
    <Box className="store-appearance-preview" dir="rtl" style={profile.cssVars} sx={{
      width: compact ? "min(100%, 360px)" : "100%", mx: "auto", overflow: "hidden", borderRadius: 3,
      background: profile.palette.background, color: profile.palette.textPrimary,
      fontFamily: "var(--font-body)", border: "1px solid var(--border-subtle)",
    }}>
      <style>{css}</style>
      <Box className="store-navbar" sx={{ p: 3, bgcolor: "var(--nav-background)" }}>{store.name} · الرئيسية · المنتجات</Box>
      <Box className="page-store-details__hero" sx={{ p: 4, background: "var(--surface)" }}>
        <Typography variant="h4" className="page-store-details__title" sx={{ overflowWrap: "anywhere" }}>{store.name}</Typography>
        <Typography className="storefront-subtitle" color="text.secondary">{store.description || "وصف المتجر يظهر هنا"}</Typography>
      </Box>
      <Box sx={{ p: 4, display: "grid", gridTemplateColumns: compact ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 3 }}>
        {["منتج تجريبي", "منتج مميز"].map((name) => <Box key={name} className="product-card" sx={{ p: 3, minWidth: 0, borderRadius: 2, background: "var(--surface-card)" }}>
          <Box sx={{ height: 90, background: "var(--surface-muted)", borderRadius: 2, mb: 2 }} />
          <Typography variant="h6" className="product-card__title">{name}</Typography>
          <Typography className="product-card__price" sx={{ color: "var(--primary)", my: 2 }}>₪ 49.00</Typography>
          <Button variant="contained" color="primary">أضف إلى السلة</Button>
        </Box>)}
      </Box>
    </Box>
  </ThemeProvider>;
}

function AppearanceEditor({ store, initial, onClose }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => ({ light: { ...initial.light }, dark: { ...initial.dark } }));
  const [mode, setMode] = useState("light");
  const [compact, setCompact] = useState(false);
  const [saved, setSaved] = useState(false);
  const [group, setGroup] = useState("عام");
  const variants = resolveStoreThemeConfig(store).availableVariants;
  const base = buildThemeProfile(variants.find((v) => buildThemeProfile(v).mode === mode) || variants[0]);
  const effective = buildThemeProfile(variants.find((v) => buildThemeProfile(v).mode === mode) || variants[0], draft);
  const mutation = useMutation({
    mutationFn: () => axiosInstance.put(`/api/Store/${store.id}/appearance`, draft),
    onSuccess: async ({ data }) => {
      queryClient.setQueryData(["store-appearance", store.id], data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stores"] }),
        queryClient.invalidateQueries({ queryKey: ["super-admin", "stores"] }),
      ]);
      setSaved(true);
    },
  });
  const change = (key, value) => {
    setSaved(false);
    setDraft((current) => {
      const next = { ...current[mode] };
      if (value === "") delete next[key]; else next[key] = value;
      return { ...current, [mode]: next };
    });
  };
  const pairs = [
    [effective.palette.textPrimary, effective.palette.background, "النص والخلفية"],
    [draft[mode].buttonText || effective.palette.buttonText, draft[mode].buttonBackground || effective.palette.primary, "الأزرار"],
    [draft[mode].productTitleColor || effective.palette.textPrimary, draft[mode].productCardBackground || effective.palette.surfaceCard, "بطاقات المنتجات"],
    [draft[mode].priceColor || effective.palette.primary, draft[mode].productCardBackground || effective.palette.surfaceCard, "الأسعار"],
  ];
  const lowContrast = pairs.filter(([a, b]) => { const ratio = contrastRatio(a, b); return ratio !== null && ratio < 4.5; }).map(([, , label]) => label);
  const invalid = ["light", "dark"].some((m) => APPEARANCE_FIELDS.some((field) => draft[m][field.key] && !validAppearanceValue(field, draft[m][field.key])));
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  return <>
    <DialogContent dividers>
      <Stack spacing={3}>
        <Typography color="text.secondary">كل وضع مستقل. الخصائص الافتراضية تتبع قالب المتجر الحالي؛ إعادة الضبط تحذف التخصيص فقط. المعاينة التالية تعرض عناصر تجريبية قبل الحفظ.</Typography>
        <Tabs value={mode} onChange={(_, value) => setMode(value)} aria-label="وضع المظهر">
          <Tab value="light" label="الوضع الفاتح" /><Tab value="dark" label="الوضع الداكن" />
        </Tabs>
        {invalid && <Alert severity="error">تحقق من القيم في الوضعين: اللون بصيغة #RRGGBB، وحجم الخط عدد صحيح من 10 إلى 96 بكسل.</Alert>}
        {mutation.isError && <Alert severity="error">{extractApiError(mutation.error, "تعذر حفظ المظهر")}</Alert>}
        {saved && <Alert severity="success">تم حفظ مظهر المتجر.</Alert>}
        {lowContrast.length > 0 && <Alert severity="warning">التباين منخفض في: {lowContrast.join("، ")}. اختر ألوانًا أوضح للقراءة.</Alert>}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 1fr) minmax(0, 1fr)" }, gap: 5 }}>
          <Stack spacing={3}>
            <TextField select label="العنصر" value={group} onChange={(e) => setGroup(e.target.value)}>
              {[...new Set(APPEARANCE_FIELDS.map((f) => f.group))].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
            {APPEARANCE_FIELDS.filter((f) => f.group === group).map((field) => {
              const value = draft[mode][field.key] || "";
              const fallback = field.cssVar ? base.cssVars[field.cssVar] : "";
              return <Box key={field.key}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                  <Typography variant="body2">{field.label}</Typography>
                  <Chip size="small" label={value ? "مخصص" : "افتراضي"} color={value ? "primary" : "default"} />
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  {field.type === "color" && <input aria-label={`اختيار ${field.label}`} type="color" disabled={mutation.isPending} value={value || (/^#[\da-f]{6}$/i.test(fallback) ? fallback : "#808080")} onChange={(e) => change(field.key, e.target.value)} />}
                  {field.type === "font" ? <TextField select fullWidth size="small" label={field.label} value={value} disabled={mutation.isPending} onChange={(e) => change(field.key, e.target.value)}>
                    <MenuItem value="">الخط الافتراضي</MenuItem>
                    {APPEARANCE_FONTS.map((font) => <MenuItem key={font} value={font} sx={{ fontFamily: font }}>{font}</MenuItem>)}
                  </TextField> : <TextField fullWidth size="small" label={field.label} type={field.type === "size" ? "number" : "text"} value={field.type === "size" ? value.replace("px", "") : value} disabled={mutation.isPending} placeholder={field.type === "size" ? "افتراضي" : fallback || "افتراضي"}
                    slotProps={{ htmlInput: field.type === "size" ? { min: 10, max: 96, step: 1 } : { pattern: "#[0-9a-fA-F]{6}", maxLength: 7 } }}
                    onChange={(e) => change(field.key, e.target.value && field.type === "size" ? `${e.target.value}px` : e.target.value)} />}
                  <Button disabled={!value || mutation.isPending} onClick={() => change(field.key, "")} aria-label={`إعادة ضبط ${field.label}`}>افتراضي</Button>
                </Stack>
              </Box>;
            })}
            <Button variant="outlined" disabled={mutation.isPending} onClick={() => { setDraft((d) => ({ ...d, [mode]: {} })); setSaved(false); }}>إعادة ضبط الوضع الحالي</Button>
            <Button disabled={mutation.isPending} onClick={() => { setDraft({ light: {}, dark: {} }); setSaved(false); }}>إعادة ضبط الوضعين</Button>
          </Stack>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">معاينة مباشرة</Typography><Button onClick={() => setCompact((v) => !v)}>{compact ? "عرض الحاسوب" : "عرض الهاتف"}</Button></Stack>
            <AppearancePreview store={store} mode={mode} draft={draft} compact={compact} />
          </Stack>
        </Box>
      </Stack>
    </DialogContent>
    <DialogActions><Button disabled={mutation.isPending} onClick={onClose}>{dirty && !saved ? "إغلاق دون حفظ" : "إغلاق"}</Button><Button variant="contained" disabled={mutation.isPending || !dirty || saved || invalid} onClick={() => mutation.mutate()}>{mutation.isPending ? "جارٍ الحفظ…" : "حفظ المظهر"}</Button></DialogActions>
  </>;
}

export default function StoreAppearanceDialog({ store, onClose }) {
  const query = useQuery({ queryKey: ["store-appearance", store.id], queryFn: async () => (await axiosInstance.get(`/api/Store/${store.id}/appearance`)).data });
  return <Dialog open onClose={undefined} fullWidth maxWidth="lg" aria-labelledby="appearance-title">
    <DialogTitle id="appearance-title">تخصيص مظهر {store.name}</DialogTitle>
    {query.isPending ? <DialogContent>جارٍ تحميل المظهر…</DialogContent> : query.isError ? <><DialogContent><Alert severity="error">{extractApiError(query.error, "تعذر تحميل المظهر")}</Alert><Button onClick={() => query.refetch()}>إعادة المحاولة</Button></DialogContent><DialogActions><Button onClick={onClose}>إغلاق</Button></DialogActions></> : <AppearanceEditor store={store} initial={query.data} onClose={onClose} />}
  </Dialog>;
}
