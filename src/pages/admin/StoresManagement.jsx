import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import useCreateStore from "../../hooks/stores/useCreateStore.js";
import useDeleteStore from "../../hooks/stores/useDeleteStore.js";
import useStores from "../../hooks/stores/useStores.js";
import { normalizeListResponse } from "../../utils/collections.js";
import { resolveAssetUrl, resolveStoreCoverUrl } from "../../utils/assetUrl.js";
import CreateStore from "./CreateStore.jsx";
import "./StoresManagement.css";

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    "تعذر تنفيذ العملية. حاول مرة أخرى."
  );
}

function AdminStoreCard({ store, onDelete, deleting, deleteDisabled }) {
  const isActive = store.isActive !== false;
  const coverImage = resolveStoreCoverUrl(store);
  const logoImage = resolveAssetUrl(store.logoUrl);
  const canOpenStore = Boolean(store.slug);

  return (
    <Paper className="admin-store-card" elevation={0}>
      <Box className="admin-store-card__media">
        {coverImage ? (
          <img src={coverImage} alt={store.name} />
        ) : (
          <Box className="admin-store-card__media-empty" aria-hidden>
            <StorefrontRoundedIcon />
          </Box>
        )}

        <Chip
          label={isActive ? "نشط" : "غير نشط"}
          size="small"
          className={`admin-store-card__status${isActive ? " admin-store-card__status--active" : ""}`}
        />

        <Box className="admin-store-card__logo-wrap">
          {logoImage ? (
            <img src={logoImage} alt={`${store.name} logo`} className="admin-store-card__logo" />
          ) : (
            <Box className="admin-store-card__logo admin-store-card__logo--empty" aria-hidden>
              {store.name?.[0] || "م"}
            </Box>
          )}
        </Box>
      </Box>

      <Box className="admin-store-card__content">
        <Stack spacing={0.4}>
          <Typography variant="overline" className="admin-store-card__eyebrow">
            متجر ظاهر في السوق
          </Typography>
          <Typography variant="h6" className="admin-store-card__title">
            {store.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" className="admin-store-card__description">
            {store.description || "لا يوجد وصف لهذا المتجر بعد."}
          </Typography>
        </Stack>

        <Box className="admin-store-card__meta">
          <Chip label={store.businessType || "متجر عام"} size="small" variant="outlined" />
          <Box className="admin-store-card__views">
            <VisibilityRoundedIcon fontSize="small" />
            <span>{store.visitCount ?? 0}</span>
          </Box>
        </Box>

        <Box className="admin-store-card__details">
          <Typography variant="caption" color="text.secondary">
            الرابط: {store.slug || "غير محدد"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            رقم المتجر: {store.id}
          </Typography>
        </Box>

        <Box className="admin-store-card__actions">
          <Button
            component={RouterLink}
            to={canOpenStore ? `/market/${store.slug}` : "/market"}
            variant="outlined"
            size="small"
            disabled={!canOpenStore}
            endIcon={<OpenInNewRoundedIcon fontSize="small" />}
          >
            فتح المتجر
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={() => onDelete(store)}
            disabled={deleting || deleteDisabled || !store.id}
            startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
          >
            {deleting ? "جاري الحذف..." : "حذف"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

export default function StoresManagement() {
  const storesQuery = useStores(undefined, { refetchOnWindowFocus: false });
  const stores = useMemo(() => normalizeListResponse(storesQuery.data), [storesQuery.data]);

  const createStoreMutation = useCreateStore();
  const deleteStoreMutation = useDeleteStore();

  const storeStats = useMemo(() => {
    const activeStores = stores.filter((store) => store.isActive !== false);

    return {
      total: stores.length,
      active: activeStores.length,
      inactive: Math.max(stores.length - activeStores.length, 0),
    };
  }, [stores]);

  const handleCreateStore = async (payload) => {
    await createStoreMutation.mutateAsync(payload);
  };

  const handleDeleteStore = (store) => {
    if (!store.id) {
      return;
    }

    const confirmed = window.confirm(`هل أنت متأكد من حذف متجر "${store.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`);

    if (!confirmed) {
      return;
    }

    deleteStoreMutation.mutate(store.id);
  };

  return (
    <Box className="admin-stores">
      <Paper className="admin-stores__hero" elevation={0}>
        <Stack spacing={1.1}>
          <Typography variant="overline" className="admin-stores__eyebrow">
            إدارة السوق
          </Typography>
          <Typography variant="h4" component="h1" className="admin-stores__title">
            إدارة المتاجر من مكان واحد
          </Typography>
          <Typography variant="body1" color="text.secondary" className="admin-stores__lead">
            هنا نقدر نضيف متجر جديد، نحذف متجر موجود، ونراقب حالة المتاجر بشكل مباشر.
          </Typography>
        </Stack>

        <Box className="admin-stores__stats">
          <Box className="admin-stores__stat">
            <Typography variant="caption" color="text.secondary">
              إجمالي المتاجر
            </Typography>
            <Typography variant="h5">{storeStats.total}</Typography>
          </Box>
          <Box className="admin-stores__stat">
            <Typography variant="caption" color="text.secondary">
              المتاجر النشطة
            </Typography>
            <Typography variant="h5">{storeStats.active}</Typography>
          </Box>
          <Box className="admin-stores__stat">
            <Typography variant="caption" color="text.secondary">
              غير النشطة
            </Typography>
            <Typography variant="h5">{storeStats.inactive}</Typography>
          </Box>
        </Box>
      </Paper>

      <CreateStore
        onSubmit={handleCreateStore}
        loading={createStoreMutation.isPending}
        title="إضافة متجر جديد"
        description="املأ البيانات الأساسية وسيظهر المتجر مباشرة في السوق بعد الحفظ."
        submitLabel="حفظ المتجر"
      />

      {createStoreMutation.isError ? (
        <Alert severity="error">{getErrorMessage(createStoreMutation.error)}</Alert>
      ) : null}

      {deleteStoreMutation.isError ? (
        <Alert severity="error">{getErrorMessage(deleteStoreMutation.error)}</Alert>
      ) : null}

      <Paper className="admin-stores__library" elevation={0}>
        <Box className="admin-stores__library-head">
          <Box>
            <Typography variant="h6" className="admin-stores__library-title">
              المتاجر الحالية
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stores.length} متجرًا جاهزًا للمراجعة
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() => storesQuery.refetch()}
            disabled={storesQuery.isFetching}
          >
            تحديث القائمة
          </Button>
        </Box>

        {storesQuery.isLoading ? (
          <Box className="admin-stores__state">
            <Typography variant="h6">جارٍ تحميل المتاجر...</Typography>
          </Box>
        ) : storesQuery.error ? (
          <Box className="admin-stores__state">
            <Typography variant="h6">تعذر تحميل المتاجر</Typography>
            <Typography variant="body2" color="text.secondary">
              حدث خلل أثناء تحميل القائمة. حاول مرة أخرى بعد قليل.
            </Typography>
            <Button variant="contained" onClick={() => storesQuery.refetch()}>
              إعادة المحاولة
            </Button>
          </Box>
        ) : stores.length ? (
          <Box className="admin-stores__grid">
            {stores.map((store) => (
              <AdminStoreCard
                key={store.id ?? store.slug ?? store.name}
                store={store}
                onDelete={handleDeleteStore}
                deleting={deleteStoreMutation.isPending && deleteStoreMutation.variables === store.id}
                deleteDisabled={deleteStoreMutation.isPending}
              />
            ))}
          </Box>
        ) : (
          <Box className="admin-stores__state">
            <Typography variant="h6">لا توجد متاجر بعد</Typography>
            <Typography variant="body2" color="text.secondary">
              عندما يتم إنشاء أول متجر سيظهر هنا تلقائيًا.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
