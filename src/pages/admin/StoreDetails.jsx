import { useDeferredValue, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useOutletContext, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog.jsx";
import AdminContactAccounts from "../../components/admin/AdminContactAccounts.jsx";
import AdminStatusChip from "../../components/admin/AdminStatusChip.jsx";
import useSuperAdminDeleteStore from "../../hooks/superAdmin/useSuperAdminDeleteStore.js";
import useSuperAdminStoreCustomers from "../../hooks/superAdmin/useSuperAdminStoreCustomers.js";
import useSuperAdminStoreDetails from "../../hooks/superAdmin/useSuperAdminStoreDetails.js";
import useSuperAdminUpdateStore from "../../hooks/superAdmin/useSuperAdminUpdateStore.js";
import useUpdateSuperAdminStoreStatus from "../../hooks/superAdmin/useUpdateSuperAdminStoreStatus.js";
import { STORE_CONTACT_PLATFORMS } from "../../utils/storeContacts.js";
import {
  buildDisplayName,
  formatAdminDate,
  formatAdminDateTime,
  getHttpStatus,
  getInitials,
  matchesSearch,
} from "../../utils/adminDashboard.js";
import { resolveAssetUrl, resolveStoreCoverUrl } from "../../utils/assetUrl.js";
import { normalizeEntityResponse, normalizeListResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import "./SuperAdminPages.css";

const CONTACT_PLATFORM_OPTIONS = Object.values(STORE_CONTACT_PLATFORMS);

function sanitizeNullableString(value) {
  const trimmedValue = String(value ?? "").trim();
  return trimmedValue ? trimmedValue : null;
}

function createContactAccount(account = {}, index = 0) {
  return {
    clientId: account.id || `contact-${index}-${Date.now()}`,
    platform: account.platform || "",
    username: account.username || "",
    label: account.label || "",
    sortOrder: Number.isFinite(Number(account.sortOrder))
      ? Number(account.sortOrder)
      : index,
  };
}

function createStoreFormState(store) {
  return {
    name: store?.name || "",
    description: store?.description || "",
    businessType: store?.businessType || "",
    logoUrl: store?.logoUrl || "",
    coverImageUrl: store?.coverImageUrl || "",
    whatsAppNumber: store?.whatsAppNumber || "",
    storeStory: store?.storeStory || "",
    themeTemplate: store?.themeTemplate || "",
    isActive: store?.isActive !== false,
    contactAccounts: Array.isArray(store?.contactAccounts)
      ? store.contactAccounts.map((account, index) => createContactAccount(account, index))
      : [],
  };
}

function sanitizeContactAccounts(accounts) {
  return accounts
    .map((account, index) => ({
      platform: String(account.platform || "").trim(),
      username: String(account.username || "").trim(),
      label: sanitizeNullableString(account.label),
      sortOrder: Number.isFinite(Number(account.sortOrder))
        ? Number(account.sortOrder)
        : index,
    }))
    .filter((account) => account.platform && account.username);
}

function DetailSkeleton() {
  return (
    <Box className="super-admin-page">
      <Skeleton variant="rounded" width="100%" height={110} />
      <Skeleton variant="rounded" width="100%" height={300} />
      <Skeleton variant="rounded" width="100%" height={360} />
    </Box>
  );
}

function StoreEditDialog({ open, store, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(() => createStoreFormState(store));

  const contactAccounts = form.contactAccounts || [];

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle>تعديل المتجر</DialogTitle>
      <DialogContent dividers>
        <Box className="super-admin-panel" sx={{ p: 0 }}>
          <Typography variant="body2" color="text.secondary">
            إرسال حسابات التواصل هنا يستبدل القائمة الحالية بالكامل في الباك إند، لذلك أبقِ
            كل حساب تريد الحفاظ عليه.
          </Typography>

          {error ? (
            <Alert severity="error">
              {extractApiError(error, "تعذر تحديث المتجر حاليًا.")}
            </Alert>
          ) : null}

          <Box
            id="store-edit-form"
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit({
                name: sanitizeNullableString(form.name),
                description: sanitizeNullableString(form.description),
                businessType: sanitizeNullableString(form.businessType),
                logoUrl: sanitizeNullableString(form.logoUrl),
                coverImageUrl: sanitizeNullableString(form.coverImageUrl),
                whatsAppNumber: sanitizeNullableString(form.whatsAppNumber),
                storeStory: sanitizeNullableString(form.storeStory),
                themeTemplate: sanitizeNullableString(form.themeTemplate),
                isActive: Boolean(form.isActive),
                contactAccounts: sanitizeContactAccounts(contactAccounts),
              });
            }}
            className="super-admin-modal-grid"
          >
            <AppTextField
              label="اسم المتجر"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <AppTextField
              label="نوع النشاط"
              value={form.businessType}
              onChange={(event) =>
                setForm((current) => ({ ...current, businessType: event.target.value }))
              }
            />
            <AppTextField
              label="الوصف"
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              sx={{ gridColumn: "1 / -1" }}
            />
            <AppTextField
              label="رابط الشعار"
              value={form.logoUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, logoUrl: event.target.value }))
              }
            />
            <AppTextField
              label="رابط صورة الغلاف"
              value={form.coverImageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
              }
            />
            <AppTextField
              label="رقم واتساب"
              value={form.whatsAppNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, whatsAppNumber: event.target.value }))
              }
            />
            <AppTextField
              label="القالب"
              value={form.themeTemplate}
              onChange={(event) =>
                setForm((current) => ({ ...current, themeTemplate: event.target.value }))
              }
            />
            <AppTextField
              label="قصة المتجر"
              multiline
              minRows={5}
              value={form.storeStory}
              onChange={(event) =>
                setForm((current) => ({ ...current, storeStory: event.target.value }))
              }
              sx={{ gridColumn: "1 / -1" }}
            />

            <Box sx={{ gridColumn: "1 / -1" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.isActive)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isActive: event.target.checked }))
                    }
                  />
                }
                label="المتجر نشط"
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
                    المنصة واسم المستخدم فقط. تكرار نفس المنصة مسموح.
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
                        ...(current.contactAccounts || []),
                        createContactAccount({}, current.contactAccounts?.length || 0),
                      ],
                    }))
                  }
                >
                  إضافة حساب
                </Button>
              </Stack>

              {contactAccounts.length ? (
                contactAccounts.map((account, index) => (
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
                      startIcon={<RemoveRoundedIcon fontSize="small" />}
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
                  لن يتم إرسال أي حسابات تواصل ما لم تضفها من هنا.
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <AppButton form="store-edit-form" loading={loading} type="submit">
          حفظ التعديلات
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

export default function StoreDetails() {
  const { notify } = useOutletContext();
  const navigate = useNavigate();
  const { storeId = "" } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [customersSearch, setCustomersSearch] = useState("");
  const deferredCustomersSearch = useDeferredValue(customersSearch);
  const [customersStatusFilter, setCustomersStatusFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const storeQuery = useSuperAdminStoreDetails(storeId);
  const customersQuery = useSuperAdminStoreCustomers(storeId, {
    enabled: activeTab === "customers" && Boolean(storeId),
  });
  const updateStoreMutation = useSuperAdminUpdateStore();
  const updateStatusMutation = useUpdateSuperAdminStoreStatus();
  const deleteStoreMutation = useSuperAdminDeleteStore();

  const store = normalizeEntityResponse(storeQuery.data) ?? null;
  const customers = useMemo(
    () => normalizeListResponse(customersQuery.data),
    [customersQuery.data],
  );
  const storeStatus = getHttpStatus(storeQuery.error);
  const customersStatus = getHttpStatus(customersQuery.error);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const isActive = customer.isActive !== false;
        const matchesStatus =
          customersStatusFilter === "all" ||
          (customersStatusFilter === "active" && isActive) ||
          (customersStatusFilter === "inactive" && !isActive);

        return (
          matchesStatus &&
          (matchesSearch(buildDisplayName(customer, "عميل متجر"), deferredCustomersSearch) ||
            matchesSearch(customer.email, deferredCustomersSearch) ||
            matchesSearch(customer.phone, deferredCustomersSearch))
        );
      }),
    [customers, customersStatusFilter, deferredCustomersSearch],
  );

  const coverImage = resolveStoreCoverUrl(store);
  const logoImage = resolveAssetUrl(store?.logoUrl);

  const customerColumns = [
    {
      key: "fullName",
      title: "العميل",
      render: (customer) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {buildDisplayName(customer, "عميل متجر")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {customer.email || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "phone",
      title: "الهاتف",
      render: (customer) => customer.phone || "-",
    },
    {
      key: "discountPercentage",
      title: "الخصم",
      render: (customer) => `${Number(customer.discountPercentage ?? 0)}%`,
    },
    {
      key: "isActive",
      title: "الحالة",
      render: (customer) => <AdminStatusChip active={customer.isActive !== false} />,
    },
    {
      key: "createdAt",
      title: "تاريخ الإنشاء",
      render: (customer) => formatAdminDate(customer.createdAt),
    },
    {
      key: "updatedAt",
      title: "آخر تحديث",
      render: (customer) => formatAdminDate(customer.updatedAt),
    },
  ];

  return (
    <Box className="super-admin-page">
      <Box className="super-admin-page__toolbar">
        <Box className="super-admin-page__toolbar-copy">
          <Typography variant="overline" className="super-admin-page__eyebrow">
            ملف المتجر
          </Typography>
          <Typography variant="h5" className="super-admin-page__title">
            {store?.name || "تفاصيل المتجر"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            راجع ملف المتجر، وبيانات المالك، وحسابات التواصل، وقصة المتجر، وعملاء المتجر.
          </Typography>
        </Box>

        <Box className="super-admin-page__actions">
          <Button
            component={RouterLink}
            to="/dashboard/stores"
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          >
            العودة إلى المتاجر
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            onClick={async () => {
              await storeQuery.refetch();

              if (activeTab === "customers") {
                await customersQuery.refetch();
              }

              notify?.({ severity: "success", message: "تم تحديث تفاصيل المتجر." });
            }}
            disabled={storeQuery.isFetching || customersQuery.isFetching}
          >
            تحديث
          </Button>
        </Box>
      </Box>

      {storeQuery.isLoading ? <DetailSkeleton /> : null}

      {!storeQuery.isLoading && storeQuery.isError ? (
        storeStatus === 404 ? (
          <EmptyState
            title="المتجر غير موجود"
            description="تعذر العثور على المتجر المطلوب."
            action={
              <Button component={RouterLink} to="/dashboard/stores" variant="contained">
                العودة إلى المتاجر
              </Button>
            }
          />
        ) : storeStatus === 403 ? (
          <EmptyState
            title="ليس لديك صلاحية"
            description="الحساب الحالي غير مخول لعرض هذا المتجر."
          />
        ) : (
          <Alert severity="error">
            {extractApiError(storeQuery.error, "تعذر تحميل هذا المتجر حاليًا.")}
          </Alert>
        )
      ) : null}

      {!storeQuery.isLoading && !storeQuery.isError && store ? (
        <>
          <Paper className="super-admin-detail-hero" elevation={0}>
            <Stack spacing={2}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                useFlexGap
              >
                <Stack spacing={0.65}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="h4">{store.name || "متجر"}</Typography>
                    <AdminStatusChip active={store.isActive !== false} />
                  </Stack>
                  <Typography variant="body1" color="text.secondary">
                    /{store.slug || "بدون رابط"} - {store.businessType || "بدون نوع نشاط"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <AppButton
                    variant="outlined"
                    startIcon={<EditRoundedIcon fontSize="small" />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    تعديل المتجر
                  </AppButton>
                  <AppButton
                    variant="outlined"
                    appearance={store.isActive !== false ? "destructive" : "primary"}
                    onClick={() => setStatusDialogOpen(true)}
                  >
                    {store.isActive !== false ? "تعطيل" : "تفعيل"}
                  </AppButton>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    حذف
                  </Button>
                </Stack>
              </Stack>

              <Box className="super-admin-store-visual">
                {coverImage ? (
                  <img src={coverImage} alt={store.name || "غلاف المتجر"} />
                ) : (
                  <Box
                    sx={{
                      minHeight: 180,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    لا توجد صورة غلاف
                  </Box>
                )}
              </Box>

              <Box className="super-admin-logo-row">
                {logoImage ? (
                  <img
                    src={logoImage}
                    alt={`${store.name || "متجر"} logo`}
                    className="super-admin-logo-thumb"
                  />
                ) : (
                  <Box className="super-admin-logo-thumb super-admin-logo-thumb--empty">
                    {getInitials(store.name, "مت")}
                  </Box>
                )}
                <Stack spacing={0.35}>
                  <Typography variant="subtitle1">{store.name || "متجر"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    الزيارات: {store.visitCount ?? 0} - العملاء: {store.customerCount ?? 0}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          <Paper className="super-admin-panel" elevation={0}>
            <Tabs
              value={activeTab}
              onChange={(_, nextValue) => setActiveTab(nextValue)}
              sx={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <Tab value="overview" label="نظرة عامة" />
              <Tab
                value="customers"
                icon={<PeopleAltRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="العملاء"
              />
            </Tabs>

            {activeTab === "overview" ? (
              <Box className="super-admin-detail-grid">
                <Paper className="super-admin-detail-card" elevation={0}>
                  <Typography variant="h6">معلومات المتجر</Typography>
                  <Box className="super-admin-info-list">
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        الوصف
                      </Typography>
                      <Typography variant="body2">{store.description || "-"}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        رقم واتساب
                      </Typography>
                      <Typography variant="body2">{store.whatsAppNumber || "-"}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        القالب
                      </Typography>
                      <Typography variant="body2">{store.themeTemplate || "-"}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        تاريخ الإنشاء
                      </Typography>
                      <Typography variant="body2">{formatAdminDateTime(store.createdAt)}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        آخر تحديث
                      </Typography>
                      <Typography variant="body2">{formatAdminDateTime(store.updatedAt)}</Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper className="super-admin-detail-card" elevation={0}>
                  <Typography variant="h6">المالك</Typography>
                  <Box className="super-admin-info-list">
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        الاسم
                      </Typography>
                      <Typography variant="body2">
                        {buildDisplayName(store.owner, "بدون مالك")}
                      </Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2">{store.owner?.email || "-"}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        حالة المالك
                      </Typography>
                      <AdminStatusChip active={store.owner?.isActive !== false} />
                    </Box>
                  </Box>
                </Paper>

                <Paper className="super-admin-detail-card" elevation={0}>
                  <Typography variant="h6">حسابات التواصل</Typography>
                  <AdminContactAccounts accounts={store.contactAccounts || []} />
                </Paper>

                <Paper className="super-admin-story-card" elevation={0}>
                  <Typography variant="h6">قصة المتجر</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {store.storeStory || "لم تتم إضافة قصة للمتجر بعد."}
                  </Typography>
                </Paper>
              </Box>
            ) : null}

            {activeTab === "customers" ? (
              <Stack spacing={2}>
                <Box className="super-admin-page__filters">
                  <SearchInput
                    value={customersSearch}
                    onChange={setCustomersSearch}
                    placeholder="ابحث في عملاء المتجر بالاسم أو البريد أو الهاتف"
                  />
                  <AppTextField
                    select
                    size="small"
                    sx={{ minWidth: 170 }}
                    label="الحالة"
                    value={customersStatusFilter}
                    onChange={(event) => setCustomersStatusFilter(event.target.value)}
                  >
                    <MenuItem value="all">كل الحالات</MenuItem>
                    <MenuItem value="active">النشطة فقط</MenuItem>
                    <MenuItem value="inactive">غير النشطة فقط</MenuItem>
                  </AppTextField>
                </Box>

                {customersQuery.isLoading ? (
                  <Stack spacing={1.2}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} variant="rounded" width="100%" height={58} />
                    ))}
                  </Stack>
                ) : customersQuery.isError ? (
                  customersStatus === 404 ? (
                    <EmptyState
                      title="قائمة العملاء غير متاحة"
                      description="هذا المتجر لا يملك قائمة عملاء متاحة من endpoint الداشبورد."
                    />
                  ) : customersStatus === 403 ? (
                    <EmptyState
                      title="ليس لديك صلاحية"
                      description="الحساب الحالي غير مخول لعرض عملاء هذا المتجر."
                    />
                  ) : (
                    <Alert severity="error">
                      {extractApiError(
                        customersQuery.error,
                        "تعذر تحميل عملاء المتجر حاليًا.",
                      )}
                    </Alert>
                  )
                ) : (
                  <AppDataTable
                    rows={filteredCustomers}
                    columns={customerColumns}
                    emptyState={
                      <EmptyState
                        title="لا يوجد عملاء مطابقون"
                        description="جرّب عبارة بحث مختلفة أو غيّر فلتر الحالة."
                      />
                    }
                  />
                )}
              </Stack>
            ) : null}
          </Paper>
        </>
      ) : null}

      <StoreEditDialog
        key={`${store?.id || "store"}-${editDialogOpen ? "open" : "closed"}`}
        open={editDialogOpen}
        store={store}
        loading={updateStoreMutation.isPending}
        error={updateStoreMutation.error}
        onClose={() => {
          updateStoreMutation.reset();
          setEditDialogOpen(false);
        }}
        onSubmit={async (payload) => {
          if (!store?.id) {
            return;
          }

          await updateStoreMutation.mutateAsync({
            storeId: store.id,
            payload,
          });

          notify?.({
            severity: "success",
            message: `تم تحديث ${store.name || "المتجر"} بنجاح.`,
          });
          setEditDialogOpen(false);
        }}
      />

      <AdminConfirmDialog
        open={statusDialogOpen}
        title={`${store?.isActive !== false ? "تعطيل" : "تفعيل"} المتجر`}
        description={
          store
            ? `هل أنت متأكد من ${store.isActive !== false ? "تعطيل" : "تفعيل"} ${store.name || "هذا المتجر"}؟`
            : "هل أنت متأكد؟"
        }
        confirmLabel={store?.isActive !== false ? "تعطيل المتجر" : "تفعيل المتجر"}
        confirmColor={store?.isActive !== false ? "warning" : "primary"}
        loading={updateStatusMutation.isPending}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={async () => {
          if (!store?.id) {
            return;
          }

          await updateStatusMutation.mutateAsync({
            storeId: store.id,
            payload: {
              isActive: store.isActive === false,
            },
          });

          notify?.({
            severity: "success",
            message: `${store.name || "المتجر"} أصبح الآن ${
              store.isActive === false ? "نشطًا" : "غير نشط"
            }.`,
          });
          setStatusDialogOpen(false);
        }}
      />

      <AdminConfirmDialog
        open={deleteDialogOpen}
        title="حذف المتجر"
        description={
          store
            ? `سيتم حذف ${store.name || "هذا المتجر"} حذفًا ناعمًا. هل تريد المتابعة؟`
            : "سيتم حذف المتجر الحالي حذفًا ناعمًا. هل تريد المتابعة؟"
        }
        confirmLabel="حذف المتجر"
        confirmColor="error"
        loading={deleteStoreMutation.isPending}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (!store?.id) {
            return;
          }

          await deleteStoreMutation.mutateAsync(store.id);
          notify?.({
            severity: "success",
            message: `تم حذف ${store.name || "المتجر"}.`,
          });
          navigate("/dashboard/stores", { replace: true });
        }}
      />
    </Box>
  );
}
