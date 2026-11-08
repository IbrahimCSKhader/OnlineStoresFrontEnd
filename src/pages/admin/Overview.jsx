import { Link as RouterLink, useOutletContext } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ContactsRoundedIcon from "@mui/icons-material/ContactsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import useSuperAdminSummary from "../../hooks/superAdmin/useSuperAdminSummary.js";
import { formatAdminNumber, getHttpStatus } from "../../utils/adminDashboard.js";
import { normalizeEntityResponse } from "../../utils/collections.js";
import "./SuperAdminPages.css";

function MetricCard({ label, value, help, icon, tone = "cool" }) {
  return (
    <Paper className={`super-admin-kpi-card super-admin-kpi-card--${tone}`} elevation={0}>
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="overline" className="super-admin-kpi-card__label">
            {label}
          </Typography>
          <Typography variant="h4" className="super-admin-kpi-card__value">
            {value}
          </Typography>
        </Box>
        <Box className="super-admin-kpi-card__icon" aria-hidden>
          {icon}
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" className="super-admin-kpi-card__help">
        {help}
      </Typography>
    </Paper>
  );
}

function SummarySkeleton() {
  return (
    <Box className="super-admin-kpi-grid">
      {Array.from({ length: 4 }).map((_, index) => (
        <Paper key={index} className="super-admin-kpi-card" elevation={0}>
          <Stack spacing={1.2}>
            <Skeleton variant="text" width="46%" height={22} />
            <Skeleton variant="text" width="28%" height={44} />
            <Skeleton variant="rounded" width="100%" height={44} />
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

export default function Overview() {
  const { notify } = useOutletContext();
  const summaryQuery = useSuperAdminSummary();
  const summary = normalizeEntityResponse(summaryQuery.data) ?? {};
  const status = getHttpStatus(summaryQuery.error);

  const metrics = [
    {
      label: "إجمالي المتاجر",
      value: formatAdminNumber(summary.totalStores),
      help: `${formatAdminNumber(summary.activeStores)} نشط - ${formatAdminNumber(summary.inactiveStores)} غير نشط`,
      icon: <StorefrontRoundedIcon fontSize="small" />,
      tone: "cool",
    },
    {
      label: "أصحاب المتاجر",
      value: formatAdminNumber(summary.totalStoreOwners),
      help: `${formatAdminNumber(summary.activeStoreOwners)} نشط - ${formatAdminNumber(summary.inactiveStoreOwners)} غير نشط`,
      icon: <PeopleAltRoundedIcon fontSize="small" />,
      tone: "accent",
    },
    {
      label: "عملاء المتاجر",
      value: formatAdminNumber(summary.totalStoreCustomers),
      help: `${formatAdminNumber(summary.activeStoreCustomers)} نشط - ${formatAdminNumber(summary.inactiveStoreCustomers)} غير نشط`,
      icon: <GroupsRoundedIcon fontSize="small" />,
      tone: "neutral",
    },
    {
      label: "حسابات التواصل",
      value: formatAdminNumber(summary.totalContactAccounts),
      help: "حسابات التواصل الظاهرة في واجهات المتاجر",
      icon: <ContactsRoundedIcon fontSize="small" />,
      tone: "cool",
    },
  ];

  return (
    <Box className="super-admin-page">
      <Box className="super-admin-page__toolbar">
        <Box className="super-admin-page__toolbar-copy">
          <Typography variant="overline" className="super-admin-page__eyebrow">
            ملخص المنصة
          </Typography>
          <Typography variant="h5" className="super-admin-page__title">
            ملخص نشاط موجة
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إحصاءات المتاجر والحسابات، وروابط لأقسام الإدارة.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon fontSize="small" />}
          onClick={async () => {
            const result = await summaryQuery.refetch();
            if (result.isSuccess) notify?.({ message: "تم تحديث الملخص." });
          }}
          disabled={summaryQuery.isFetching}
        >
          {summaryQuery.isFetching ? "جارٍ التحديث..." : "تحديث"}
        </Button>
      </Box>

      {summaryQuery.isLoading ? <SummarySkeleton /> : null}

      {!summaryQuery.isLoading && summaryQuery.isError ? (
        status === 403 ? (
          <EmptyState
            title="ليس لديك صلاحية"
            description="الحساب الحالي غير مخول لعرض ملخص السوبر أدمن."
          />
        ) : status === 404 ? (
          <EmptyState
            title="الملخص غير متاح"
            description="الـ API لم تُرجع بيانات الملخص حتى الآن."
          />
        ) : (
          <Alert severity="error">تعذر تحميل ملخص اللوحة الآن. حاول التحديث مرة أخرى.</Alert>
        )
      ) : null}

      {!summaryQuery.isLoading && !summaryQuery.isError ? (
        <>
          <Box className="super-admin-kpi-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </Box>

          <Box className="super-admin-quick-grid">
            <Paper className="super-admin-quick-card" elevation={0}>
              <Stack spacing={1.2}>
                <Typography variant="h6">أصحاب المتاجر</Typography>
                <Typography variant="body2" color="text.secondary">
                  أنشئ حسابات الملاك، أدر تفعيلها، وغيّر كلمات المرور.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button component={RouterLink} to="/dashboard/owners" variant="contained">
                    فتح صفحة الملاك
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper className="super-admin-quick-card" elevation={0}>
              <Stack spacing={1.2}>
                <Typography variant="h6">المتاجر وعملياتها</Typography>
                <Typography variant="body2" color="text.secondary">
                  اختر متجرًا لتعديل إعداداته ومظهره أو إدارة المنتجات والطلبات والعملاء.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button component={RouterLink} to="/dashboard/stores" variant="contained">
                    فتح صفحة المتاجر
                  </Button>
                </Stack>
              </Stack>
            </Paper>
            <Paper className="super-admin-quick-card" elevation={0}>
              <Stack spacing={1.2} alignItems="start">
                <Typography variant="h6">باقات الاشتراك</Typography>
                <Typography variant="body2" color="text.secondary">أدر أسعار الباقات والحدود والميزات المتاحة لكل باقة.</Typography>
                <Button component={RouterLink} to="/dashboard/plans" variant="contained">إدارة الباقات</Button>
              </Stack>
            </Paper>
            <Paper className="super-admin-quick-card" elevation={0}>
              <Stack spacing={1.2} alignItems="start">
                <Typography variant="h6">صيانة التخزين</Typography>
                <Typography variant="body2" color="text.secondary">جهّز مجلدات الصور وافحص المجلدات الفارغة.</Typography>
                <Button component={RouterLink} to="/dashboard/system" variant="contained">أدوات الصيانة</Button>
              </Stack>
            </Paper>
          </Box>
        </>
      ) : null}
    </Box>
  );
}
