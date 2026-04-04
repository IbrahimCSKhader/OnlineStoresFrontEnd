import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import AppModal from "../../components/common/modals/AppModal.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog.jsx";
import AdminStatusChip from "../../components/admin/AdminStatusChip.jsx";
import useCreateStore from "../../hooks/stores/useCreateStore.js";
import useSuperAdminDeleteStore from "../../hooks/superAdmin/useSuperAdminDeleteStore.js";
import useSuperAdminStores from "../../hooks/superAdmin/useSuperAdminStores.js";
import useUpdateSuperAdminStoreStatus from "../../hooks/superAdmin/useUpdateSuperAdminStoreStatus.js";
import {
  buildDisplayName,
  formatAdminDate,
  getHttpStatus,
  matchesSearch,
} from "../../utils/adminDashboard.js";
import { normalizeListResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import {
  normalizeStoreContactUsername,
  STORE_CONTACT_PLATFORMS,
} from "../../utils/storeContacts.js";
import "./SuperAdminPages.css";

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "active", label: "النشطة فقط" },
  { value: "inactive", label: "غير النشطة فقط" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث أولًا" },
  { value: "oldest", label: "الأقدم أولًا" },
  { value: "visits-desc", label: "الأكثر زيارة" },
  { value: "customers-desc", label: "الأكثر عملاء" },
  { value: "name-asc", label: "الاسم أ - ي" },
];

const CONTACT_PLATFORM_OPTIONS = Object.values(STORE_CONTACT_PLATFORMS);

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

function sanitizeNullableString(value) {
  const trimmedValue = String(value ?? "").trim();
  return trimmedValue ? trimmedValue : undefined;
}

function createContactAccount(index = 0) {
  return {
    clientId: `contact-${index}-${Date.now()}`,
    platform: "",
    username: "",
    label: "",
    sortOrder: index,
  };
}

function createStoreFormState() {
  return {
    name: "",
    slug: "",
    slugManuallyEdited: false,
    description: "",
    businessType: "",
    whatsAppNumber: "",
    storeStory: "",
    themeTemplate: "",
    logoFile: null,
    coverPageFile: null,
    contactAccounts: [],
  };
}

function sanitizeContactAccounts(accounts) {
  return accounts
    .map((account, index) => {
      const platform = String(account.platform || "").trim();
      const username = normalizeStoreContactUsername(platform, account.username);

      return {
        Platform: platform,
        Username: username,
        Label: sanitizeNullableString(account.label),
        SortOrder: Number.isFinite(Number(account.sortOrder))
          ? Number(account.sortOrder)
          : index,
      };
    })
    .filter((account) => account.Platform && account.Username);
}

function sortStores(stores, sortBy) {
  const items = [...stores];

  items.sort((left, right) => {
    switch (sortBy) {
      case "oldest":
        return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
      case "visits-desc":
        return Number(right.visitCount ?? 0) - Number(left.visitCount ?? 0);
      case "customers-desc":
        return Number(right.customerCount ?? 0) - Number(left.customerCount ?? 0);
      case "name-asc":
        return String(left.name || "").localeCompare(String(right.name || ""), "ar");
      case "newest":
      default:
        return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    }
  });

  return items;
}

function StoresSkeleton() {
  return (
    <Paper className="super-admin-panel super-admin-table-card" elevation={0}>
      <Stack spacing={1.2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" width="100%" height={64} />
        ))}
      </Stack>
    </Paper>
  );
}

function CreateStoreModal({ open, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(() => createStoreFormState());
  const slugPreview = slugify(form.slug || form.name || "store");

  const updateForm = (key, value) => {
    setForm((current) => {
      if (key === "slug") {
        return {
          ...current,
          slug: slugify(value),
          slugManuallyEdited: true,
        };
      }

      if (key === "name") {
        const nextState = { ...current, name: value };
        const previousAutoSlug = slugify(current.name);

        if (!current.slugManuallyEdited || !current.slug || current.slug === previousAutoSlug) {
          nextState.slug = slugify(value);
          nextState.slugManuallyEdited = false;
        }

        return nextState;
      }

      return { ...current, [key]: value };
    });
  };

  return (
    <AppModal
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      key={open ? "create-store-open" : "create-store-closed"}
    >
      <Box className="super-admin-panel">
        <Box>
          <Typography variant="h6">إنشاء متجر جديد</Typography>
          <Typography variant="body2" color="text.secondary">
            يمكنك إنشاء متجر من هنا، لكن الباك إند الحالي لا يتيح اختيار مالك مختلف وقت
            الإنشاء؛ لذلك سيربطه بالمستخدم المسجل دخوله حاليًا.
          </Typography>
        </Box>

        <Alert severity="warning">
          اختيار المالك غير متاح حاليًا من هذه الـ API. أرسل فقط بيانات المتجر الأساسية
          وحسابات التواصل الاختيارية.
        </Alert>

        {error ? (
          <Alert severity="error">{extractApiError(error, "تعذر إنشاء المتجر حاليًا.")}</Alert>
        ) : null}

        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();

            onSubmit({
              Name: form.name.trim(),
              Slug: slugify(form.slug || form.name),
              Description: sanitizeNullableString(form.description),
              BusinessType: sanitizeNullableString(form.businessType),
              WhatsAppNumber: sanitizeNullableString(form.whatsAppNumber),
              StoreStory: sanitizeNullableString(form.storeStory),
              ThemeTemplate: sanitizeNullableString(form.themeTemplate),
              Logo: form.logoFile || undefined,
              CoverPage: form.coverPageFile || undefined,
              ContactAccounts: sanitizeContactAccounts(form.contactAccounts),
            });
          }}
          className="super-admin-modal-grid"
        >
          <AppTextField
            label="اسم المتجر"
            value={form.name}
            required
            onChange={(event) => updateForm("name", event.target.value)}
          />
          <AppTextField
            label="رابط المتجر"
            value={form.slug}
            required
            helperText={`الرابط الحالي: /${slugPreview || "store"}`}
            onChange={(event) => updateForm("slug", event.target.value)}
          />
          <AppTextField
            label="نوع النشاط"
            value={form.businessType}
            onChange={(event) => updateForm("businessType", event.target.value)}
          />
          <AppTextField
            label="رقم واتساب"
            value={form.whatsAppNumber}
            onChange={(event) => updateForm("whatsAppNumber", event.target.value)}
          />
          <AppTextField
            label="الوصف"
            multiline
            minRows={3}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            sx={{ gridColumn: "1 / -1" }}
          />
          <AppTextField
            label="قصة المتجر"
            multiline
            minRows={4}
            value={form.storeStory}
            onChange={(event) => updateForm("storeStory", event.target.value)}
            sx={{ gridColumn: "1 / -1" }}
          />
          <AppTextField
            label="القالب"
            value={form.themeTemplate}
            onChange={(event) => updateForm("themeTemplate", event.target.value)}
          />

          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Typography variant="subtitle2">شعار المتجر</Typography>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => updateForm("logoFile", event.target.files?.[0] || null)}
            />
          </Box>

          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Typography variant="subtitle2">صورة الغلاف</Typography>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => updateForm("coverPageFile", event.target.files?.[0] || null)}
            />
          </Box>

          <Box sx={{ gridColumn: "1 / -1", display: "grid", gap: 12 }}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <Box>
                <Typography variant="subtitle1">حسابات التواصل</Typography>
                <Typography variant="body2" color="text.secondary">
                  المنصة واسم المستخدم فقط. يمكن تكرار نفس المنصة أكثر من مرة.
                </Typography>
              </Box>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AddRoundedIcon fontSize="small" />}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    contactAccounts: [
                      ...current.contactAccounts,
                      createContactAccount(current.contactAccounts.length),
                    ],
                  }))
                }
              >
                إضافة حساب
              </Button>
            </Stack>

            {form.contactAccounts.length ? (
              form.contactAccounts.map((account, index) => (
                <Box key={account.clientId} className="super-admin-contact-row">
                  <AppTextField
                    select
                    label="المنصة"
                    value={account.platform}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contactAccounts: current.contactAccounts.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, platform: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  >
                    {CONTACT_PLATFORM_OPTIONS.map((platform) => (
                      <MenuItem key={platform} value={platform}>
                        {platform}
                      </MenuItem>
                    ))}
                  </AppTextField>
                  <AppTextField
                    label="اسم المستخدم / الرقم"
                    value={account.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contactAccounts: current.contactAccounts.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, username: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <AppTextField
                    label="العنوان"
                    value={account.label}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contactAccounts: current.contactAccounts.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <AppTextField
                    label="الترتيب"
                    type="number"
                    value={account.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        contactAccounts: current.contactAccounts.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, sortOrder: event.target.value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    color="error"
                    variant="outlined"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        contactAccounts: current.contactAccounts.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      }))
                    }
                  >
                    حذف
                  </Button>
                </Box>
              ))
            ) : (
              <Box className="super-admin-empty-inline">
                لن يتم إرسال أي حساب تواصل ما لم تضفه من هنا.
              </Box>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            sx={{ gridColumn: "1 / -1" }}
          >
            <Button onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <AppButton type="submit" loading={loading}>
              إنشاء المتجر
            </AppButton>
          </Stack>
        </Box>
      </Box>
    </AppModal>
  );
}

export default function Stores() {
  const { notify } = useOutletContext();
  const storesQuery = useSuperAdminStores();
  const updateStatusMutation = useUpdateSuperAdminStoreStatus();
  const deleteStoreMutation = useSuperAdminDeleteStore();
  const createStoreMutation = useCreateStore();

  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    store: null,
    nextStatus: true,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    store: null,
  });

  const stores = useMemo(() => normalizeListResponse(storesQuery.data), [storesQuery.data]);
  const status = getHttpStatus(storesQuery.error);

  const filteredStores = useMemo(() => {
    const items = stores.filter((store) => {
      const isActive = store.isActive !== false;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return (
        matchesStatus &&
        (matchesSearch(store.name, deferredSearchValue) ||
          matchesSearch(store.slug, deferredSearchValue) ||
          matchesSearch(store.businessType, deferredSearchValue) ||
          matchesSearch(buildDisplayName(store.owner), deferredSearchValue) ||
          matchesSearch(store.owner?.email, deferredSearchValue))
      );
    });

    return sortStores(items, sortBy);
  }, [deferredSearchValue, sortBy, statusFilter, stores]);

  const columns = [
    {
      key: "name",
      title: "المتجر",
      render: (store) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {store.name || "متجر"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /{store.slug || "بدون رابط"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "owner",
      title: "المالك",
      render: (store) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {buildDisplayName(store.owner, "بدون مالك")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {store.owner?.email || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "businessType",
      title: "نوع النشاط",
      render: (store) => store.businessType || "-",
    },
    {
      key: "isActive",
      title: "الحالة",
      render: (store) => <AdminStatusChip active={store.isActive !== false} />,
    },
    { key: "customerCount", title: "العملاء" },
    { key: "visitCount", title: "الزيارات" },
    {
      key: "createdAt",
      title: "تاريخ الإنشاء",
      render: (store) => formatAdminDate(store.createdAt),
    },
    {
      key: "actions",
      title: "الإجراءات",
      render: (store) => (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            component={RouterLink}
            to={`/dashboard/stores/${store.id}`}
            size="small"
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon fontSize="small" />}
          >
            فتح
          </Button>
          <AppButton
            size="small"
            variant="contained"
            appearance={store.isActive !== false ? "destructive" : "primary"}
            onClick={() =>
              setStatusDialog({
                open: true,
                store,
                nextStatus: store.isActive === false,
              })
            }
          >
            {store.isActive !== false ? "تعطيل" : "تفعيل"}
          </AppButton>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
            onClick={() => setDeleteDialog({ open: true, store })}
          >
            حذف
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box className="super-admin-page">
      <Box className="super-admin-page__toolbar">
        <Box className="super-admin-page__toolbar-copy">
          <Typography variant="overline" className="super-admin-page__eyebrow">
            المتاجر
          </Typography>
          <Typography variant="h5" className="super-admin-page__title">
            جميع متاجر المنصة في مكان واحد
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ابحث وافرز محليًا، وافتح تفاصيل أي متجر، وتحكم بالتفعيل أو الحذف الناعم من نفس
            الشاشة.
          </Typography>
        </Box>

        <Box className="super-admin-page__actions">
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            onClick={async () => {
              await storesQuery.refetch();
              notify?.({ severity: "success", message: "تم تحديث قائمة المتاجر." });
            }}
            disabled={storesQuery.isFetching}
          >
            {storesQuery.isFetching ? "جارٍ التحديث..." : "تحديث"}
          </Button>
          <AppButton
            startIcon={<AddRoundedIcon fontSize="small" />}
            onClick={() => setCreateModalOpen(true)}
          >
            إنشاء متجر
          </AppButton>
        </Box>
      </Box>

      <Alert severity="info" icon={<StorefrontRoundedIcon fontSize="inherit" />}>
        يمكنك إنشاء متجر من السوبر أدمن الآن، لكن تعيين المالك ما زال محدودًا من جهة الباك
        إند: قيمة <code>OwnerId</code> لا تُستخدم حاليًا عند الإنشاء.
      </Alert>

      <Paper className="super-admin-panel" elevation={0}>
        <Box className="super-admin-page__filters">
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            placeholder="ابحث باسم المتجر أو الرابط أو نوع النشاط أو اسم المالك"
          />
          <AppTextField
            select
            size="small"
            sx={{ minWidth: 170 }}
            label="الحالة"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </AppTextField>
          <AppTextField
            select
            size="small"
            sx={{ minWidth: 180 }}
            label="الفرز"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </AppTextField>
        </Box>
      </Paper>

      {storesQuery.isLoading ? <StoresSkeleton /> : null}

      {!storesQuery.isLoading && !storesQuery.isError && createStoreMutation.isError ? (
        <Alert severity="error">
          {extractApiError(createStoreMutation.error, "تعذر إنشاء المتجر حاليًا.")}
        </Alert>
      ) : null}

      {!storesQuery.isLoading && !storesQuery.isError ? (
        <Paper className="super-admin-panel super-admin-table-card" elevation={0}>
          <Box className="super-admin-panel__head">
            <Box>
              <Typography variant="h6" className="super-admin-panel__title">
                قائمة المتاجر
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredStores.length} متجر بعد تطبيق البحث والفلترة المحلية.
              </Typography>
            </Box>
          </Box>

          <AppDataTable
            rows={filteredStores}
            columns={columns}
            emptyState={
              <EmptyState
                title="لا توجد متاجر مطابقة"
                description="جرّب عبارة بحث مختلفة أو غيّر إعدادات الفلترة."
              />
            }
          />
        </Paper>
      ) : null}

      {!storesQuery.isLoading && storesQuery.isError ? (
        status === 403 ? (
          <EmptyState
            title="ليس لديك صلاحية"
            description="الحساب الحالي غير مخول لعرض قائمة متاجر السوبر أدمن."
          />
        ) : status === 404 ? (
          <EmptyState
            title="لا توجد متاجر"
            description="الـ API لم تُرجع متاجر للداشبورد حتى الآن."
          />
        ) : (
          <Alert severity="error">
            {extractApiError(storesQuery.error, "تعذر تحميل المتاجر حاليًا.")}
          </Alert>
        )
      ) : null}

      <CreateStoreModal
        key={createModalOpen ? "create-store-open" : "create-store-closed"}
        open={createModalOpen}
        loading={createStoreMutation.isPending}
        error={createStoreMutation.error}
        onClose={() => {
          createStoreMutation.reset();
          setCreateModalOpen(false);
        }}
        onSubmit={async (payload) => {
          await createStoreMutation.mutateAsync(payload);
          notify?.({
            severity: "success",
            message: "تم إنشاء المتجر بنجاح.",
          });
          setCreateModalOpen(false);
        }}
      />

      <AdminConfirmDialog
        open={statusDialog.open}
        title={`${statusDialog.nextStatus ? "تفعيل" : "تعطيل"} المتجر`}
        description={
          statusDialog.store
            ? `هل أنت متأكد من ${statusDialog.nextStatus ? "تفعيل" : "تعطيل"} ${statusDialog.store.name || "هذا المتجر"}؟`
            : "هل أنت متأكد؟"
        }
        confirmLabel={statusDialog.nextStatus ? "تفعيل المتجر" : "تعطيل المتجر"}
        confirmColor={statusDialog.nextStatus ? "primary" : "warning"}
        loading={updateStatusMutation.isPending}
        onClose={() =>
          setStatusDialog({
            open: false,
            store: null,
            nextStatus: true,
          })
        }
        onConfirm={async () => {
          if (!statusDialog.store?.id) {
            return;
          }

          await updateStatusMutation.mutateAsync({
            storeId: statusDialog.store.id,
            payload: {
              isActive: statusDialog.nextStatus,
            },
          });

          notify?.({
            severity: "success",
            message: `${statusDialog.store.name || "المتجر"} أصبح ${
              statusDialog.nextStatus ? "نشطًا" : "غير نشط"
            }.`,
          });
          setStatusDialog({
            open: false,
            store: null,
            nextStatus: true,
          });
        }}
      />

      <AdminConfirmDialog
        open={deleteDialog.open}
        title="حذف المتجر"
        description={
          deleteDialog.store
            ? `سيتم حذف ${deleteDialog.store.name || "هذا المتجر"} حذفًا ناعمًا. هل تريد المتابعة؟`
            : "سيتم حذف المتجر الحالي حذفًا ناعمًا. هل تريد المتابعة؟"
        }
        confirmLabel="حذف المتجر"
        confirmColor="error"
        loading={deleteStoreMutation.isPending}
        onClose={() =>
          setDeleteDialog({
            open: false,
            store: null,
          })
        }
        onConfirm={async () => {
          if (!deleteDialog.store?.id) {
            return;
          }

          await deleteStoreMutation.mutateAsync(deleteDialog.store.id);
          notify?.({
            severity: "success",
            message: `تم حذف ${deleteDialog.store.name || "المتجر"}.`,
          });
          setDeleteDialog({
            open: false,
            store: null,
          });
        }}
      />
    </Box>
  );
}
