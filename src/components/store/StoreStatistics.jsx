import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import Inventory2Rounded from "@mui/icons-material/Inventory2Rounded";
import StarRounded from "@mui/icons-material/StarRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import useStorefrontSession from "../../hooks/auth/useStorefrontSession.js";
import useStorefrontLanguage from "../../hooks/storefront/useStorefrontLanguage.js";
import storeApi from "../../API/store.api.js";

function useCounterProgress(section, ready) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!ready || !section.current) return;

    let frame;
    let start;
    const animate = (time) => {
      start ??= time;
      const fraction = Math.min(1, (time - start) / 850);
      setProgress(1 - (1 - fraction) ** 3);
      if (fraction < 1) frame = requestAnimationFrame(animate);
    };
    const play = () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || typeof IntersectionObserver === "undefined") {
        setProgress(1);
      } else {
        frame = requestAnimationFrame(animate);
      }
    };

    let observer;
    if (typeof IntersectionObserver === "undefined") {
      play();
    } else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          play();
        }
      }, { threshold: 0.15 });
      observer.observe(section.current);
    }
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ready, section]);
  return progress;
}

function getGuestRatingId(storeId) {
  const key = `store-rating-guest:${storeId.toLowerCase()}`;
  const current = localStorage.getItem(key);
  if (current) return current;
  const guestId = crypto.randomUUID();
  localStorage.setItem(key, guestId);
  return guestId;
}

export default function StoreStatistics({ storeId, storeSlug, visitCount, isOwnerPreview }) {
  const { t, locale, dir } = useStorefrontLanguage();
  const theme = useTheme();
  const ratingTheme = useMemo(() => ({ ...theme, direction: dir || "rtl" }), [theme, dir]);
  const { hasScopedStorefrontSession, storefrontSession } = useStorefrontSession(storeId, storeSlug);
  const queryClient = useQueryClient();
  const queryKey = ["store-statistics", storeId];
  const statistics = useQuery({ queryKey, queryFn: () => storeApi.getStoreStatistics(storeId) });
  const section = useRef(null);
  const ratingLabelId = useId();
  const [score, setScore] = useState(null);
  const progress = useCounterProgress(section, Boolean(statistics.data));
  const submit = useMutation({
    mutationFn: async () => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const token = hasScopedStorefrontSession ? storefrontSession.token : "";
      const guestId = token ? undefined : getGuestRatingId(storeId);
      return storeApi.rateStore(storeId, { score, guestId }, token);
    },
    onSuccess: data => queryClient.setQueryData(queryKey, data),
  });

  const data = statistics.data;
  const rating = data?.averageRating;
  const visualProgress = statistics.isError ? 1 : progress;
  const metrics = [
    { icon: <VisibilityRounded fontSize="small" />, label: t("عدد الزيارات"), value: data ? Math.max(data.visitCount, visitCount ?? 0) : visitCount },
    { icon: <Inventory2Rounded fontSize="small" />, label: t("عدد المنتجات"), value: data?.productCount },
    { icon: <StarRounded fontSize="small" />, label: t("التقييم العام"), value: rating, isRating: true },
  ];

  return (
    <Box component="section" ref={section} className="store-statistics" aria-label={t("إحصائيات المتجر")}>
      <Box className="store-statistics__metrics">
        {metrics.map(({ icon, label, value, isRating }) => {
          const number = isRating ? value * visualProgress : Math.round(value * visualProgress);
          return (
            <Box key={label} className="storefront-metric store-statistics__metric">
              {icon}
              <span className="storefront-metric__label">{label}</span>
              <strong className="storefront-metric__value">
                {value == null ? "—" : number.toLocaleString(locale, {
                  minimumFractionDigits: isRating ? 1 : 0,
                  maximumFractionDigits: isRating ? 1 : 0,
                })}
                {isRating && value != null && <span className="store-statistics__rating-max"> / 5</span>}
              </strong>
              {isRating && rating != null && <small>{t("{0} تقييم", data.ratingCount.toLocaleString(locale))}</small>}
            </Box>
          );
        })}
      </Box>
      {statistics.isError && <Alert severity="error" action={<Button onClick={() => statistics.refetch()}>{t("إعادة المحاولة")}</Button>}>
        {t("تعذر تحميل إحصائيات المتجر.")}
      </Alert>}
      {!isOwnerPreview && (
        <Box component="form" className="store-statistics__rating" onSubmit={event => {
          event.preventDefault();
          if (score && !submit.isPending) submit.mutate();
        }}>
          <Typography component="span" id={ratingLabelId} fontWeight={700}>{t("قيّم المتجر")}</Typography>
          <Box dir={dir} role="group" aria-labelledby={ratingLabelId}>
            <ThemeProvider theme={ratingTheme}>
              <Rating name={ratingLabelId} value={score} disabled={submit.isPending}
                onChange={(_, value) => { setScore(value); submit.reset(); }}
                getLabelText={value => t("{0} من 5 نجوم", value)} />
            </ThemeProvider>
          </Box>
          <Button type="submit" variant="outlined" disabled={!score || submit.isPending}>{t("إرسال التقييم")}</Button>
          {submit.isSuccess && <Typography role="status" color="success.main" dir={dir}>{t("تم حفظ تقييمك.")}</Typography>}
          {submit.isError && <Typography role="alert" color="error.main" dir={dir}>{t("تعذر حفظ التقييم. حاول مرة أخرى.")}</Typography>}
        </Box>
      )}
    </Box>
  );
}
