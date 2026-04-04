import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AppButton from "../../components/common/buttons/AppButton.jsx";
import EmptyState from "../../components/common/feedback/EmptyState.jsx";
import AppTextField from "../../components/common/inputs/AppTextField.jsx";
import SearchInput from "../../components/common/inputs/SearchInput.jsx";
import AppModal from "../../components/common/modals/AppModal.jsx";
import AppDataTable from "../../components/common/tables/AppDataTable.jsx";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog.jsx";
import AdminContactAccounts from "../../components/admin/AdminContactAccounts.jsx";
import AdminStatusChip from "../../components/admin/AdminStatusChip.jsx";
import useAdminChangeUserPassword from "../../hooks/superAdmin/useAdminChangeUserPassword.js";
import useCreateOwnerAccount from "../../hooks/superAdmin/useCreateOwnerAccount.js";
import useSuperAdminOwnerDetails from "../../hooks/superAdmin/useSuperAdminOwnerDetails.js";
import useSuperAdminOwners from "../../hooks/superAdmin/useSuperAdminOwners.js";
import useUpdateSuperAdminOwnerStatus from "../../hooks/superAdmin/useUpdateSuperAdminOwnerStatus.js";
import {
  buildDisplayName,
  formatAdminDate,
  formatAdminDateTime,
  getHttpStatus,
  matchesSearch,
} from "../../utils/adminDashboard.js";
import { normalizeEntityResponse, normalizeListResponse } from "../../utils/collections.js";
import extractApiError from "../../utils/extractApiError.js";
import "./SuperAdminPages.css";

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "active", label: "النشطة فقط" },
  { value: "inactive", label: "غير النشطة فقط" },
];

const SORT_OPTIONS = [
  { value: "stores-desc", label: "الأكثر متاجر" },
  { value: "stores-asc", label: "الأقل متاجر" },
  { value: "newest", label: "الأحدث أولًا" },
  { value: "oldest", label: "الأقدم أولًا" },
  { value: "name-asc", label: "الاسم أ - ي" },
];

function sortOwners(owners, sortBy) {
  const items = [...owners];

  items.sort((left, right) => {
    switch (sortBy) {
      case "stores-asc":
        return Number(left.storeCount ?? 0) - Number(right.storeCount ?? 0);
      case "newest":
        return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      case "oldest":
        return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
      case "name-asc":
        return buildDisplayName(left).localeCompare(buildDisplayName(right), "en");
      case "stores-desc":
      default:
        return Number(right.storeCount ?? 0) - Number(left.storeCount ?? 0);
    }
  });

  return items;
}

function OwnersSkeleton() {
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

function CreateOwnerModal({
  open,
  loading,
  error,
  existingEmails = [],
  onClose,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
    }
  }, [open, reset]);

  return (
    <AppModal open={open} onClose={loading ? undefined : onClose}>
      <Box className="super-admin-panel">
        <Box>
          <Typography variant="h6">إنشاء صاحب متجر</Typography>
          <Typography variant="body2" color="text.secondary">
            سيتم إنشاء حساب إداري من نوع StoreOwner. قد يحتاج المالك إلى تأكيد بريده
            الإلكتروني قبل أول تسجيل دخول.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error">{extractApiError(error, "تعذر إنشاء المالك حاليًا.")}</Alert>
        ) : null}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} className="super-admin-modal-grid">
          <AppTextField
            label="الاسم الأول"
            {...register("firstName", {
              required: "الاسم الأول مطلوب.",
              minLength: { value: 2, message: "يجب إدخال حرفين على الأقل." },
            })}
            error={Boolean(errors.firstName)}
            helperText={errors.firstName?.message}
          />
          <AppTextField
            label="اسم العائلة"
            {...register("lastName", {
              required: "اسم العائلة مطلوب.",
              minLength: { value: 2, message: "يجب إدخال حرفين على الأقل." },
            })}
            error={Boolean(errors.lastName)}
            helperText={errors.lastName?.message}
          />
          <AppTextField
            label="البريد الإلكتروني"
            type="email"
            {...register("email", {
              required: "البريد الإلكتروني مطلوب.",
              validate: (value) => {
                const normalizedValue = String(value || "").trim().toLowerCase();

                if (!/\S+@\S+\.\S+/.test(normalizedValue)) {
                  return "أدخل بريدًا إلكترونيًا صحيحًا.";
                }

                if (existingEmails.includes(normalizedValue)) {
                  return "هذا البريد مستخدم بالفعل ضمن حسابات الملاك الحالية.";
                }

                return true;
              },
            })}
            error={Boolean(errors.email)}
            helperText={errors.email?.message || "سيتم التحقق من صيغة الإيميل وعدم تكراره أولًا."}
          />
          <AppTextField
            label="كلمة المرور"
            type="password"
            {...register("password", {
              required: "كلمة المرور مطلوبة.",
              minLength: {
                value: 8,
                message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
              },
            })}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />

          <Stack
            direction="row"
            spacing={1.25}
            justifyContent="flex-end"
            className="super-admin-modal-grid"
            sx={{ gridColumn: "1 / -1" }}
          >
            <Button onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <AppButton type="submit" loading={loading}>
              إنشاء المالك
            </AppButton>
          </Stack>
        </Box>
      </Box>
    </AppModal>
  );
}

function ChangePasswordModal({ owner, open, loading, error, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [open, reset]);

  return (
    <AppModal open={open} onClose={loading ? undefined : onClose}>
      <Box className="super-admin-panel">
        <Box>
          <Typography variant="h6">تغيير كلمة مرور المالك</Typography>
          <Typography variant="body2" color="text.secondary">
            سيتم تغيير كلمة المرور للحساب <strong>{buildDisplayName(owner)}</strong> بدون المساس
            بأي بيانات أخرى.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error">
            {extractApiError(error, "تعذر تغيير كلمة المرور حاليًا.")}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} className="super-admin-modal-grid">
          <AppTextField
            label="كلمة المرور الجديدة"
            type="password"
            {...register("newPassword", {
              required: "كلمة المرور الجديدة مطلوبة.",
              minLength: {
                value: 6,
                message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
              },
            })}
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword?.message}
          />
          <AppTextField
            label="تأكيد كلمة المرور"
            type="password"
            {...register("confirmPassword", {
              required: "يرجى تأكيد كلمة المرور الجديدة.",
              validate: (value) =>
                value === getValues("newPassword") || "كلمتا المرور غير متطابقتين.",
            })}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
          />

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
              حفظ كلمة المرور
            </AppButton>
          </Stack>
        </Box>
      </Box>
    </AppModal>
  );
}

function OwnerDetailsDrawer({ open, ownerId, fallbackOwner, onClose }) {
  const ownerDetailsQuery = useSuperAdminOwnerDetails(ownerId, { enabled: open && Boolean(ownerId) });
  const owner = normalizeEntityResponse(ownerDetailsQuery.data) ?? fallbackOwner ?? null;
  const status = getHttpStatus(ownerDetailsQuery.error);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ className: "super-admin-drawer__paper" }}
    >
      <Box className="super-admin-drawer__body">
        {ownerDetailsQuery.isLoading ? (
          <Stack spacing={1.2}>
            <Skeleton variant="rounded" width="100%" height={80} />
            <Skeleton variant="rounded" width="100%" height={120} />
            <Skeleton variant="rounded" width="100%" height={220} />
          </Stack>
        ) : ownerDetailsQuery.isError && status === 404 ? (
          <EmptyState
            title="لم يتم العثور على المالك"
            description="تعذر العثور على بيانات هذا المالك. ربما تم تغييره أو لم يعد متاحًا."
          />
        ) : ownerDetailsQuery.isError ? (
          <Alert severity="error">
            {status === 403
              ? "ليس لديك صلاحية لعرض هذا المالك."
              : "تعذر تحميل تفاصيل المالك حاليًا."}
          </Alert>
        ) : owner ? (
          <>
            <Paper className="super-admin-detail-hero" elevation={0}>
              <Stack spacing={1.1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h5">{buildDisplayName(owner, "مالك متجر")}</Typography>
                  <AdminStatusChip active={owner.isActive !== false} />
                </Stack>
                <Typography variant="body1">{owner.email || "-"}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" color="text.secondary">
                    أُنشئ في {formatAdminDateTime(owner.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    آخر تحديث {formatAdminDateTime(owner.updatedAt)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Paper className="super-admin-detail-card" elevation={0}>
              <Typography variant="h6">ملخص المالك</Typography>
              <Box className="super-admin-info-list">
                <Box className="super-admin-info-row">
                  <Typography variant="body2" color="text.secondary">
                    إجمالي المتاجر
                  </Typography>
                  <Typography variant="body2">{owner.storeCount ?? 0}</Typography>
                </Box>
                <Box className="super-admin-info-row">
                  <Typography variant="body2" color="text.secondary">
                    المتاجر النشطة
                  </Typography>
                  <Typography variant="body2">{owner.activeStoreCount ?? 0}</Typography>
                </Box>
                <Box className="super-admin-info-row">
                  <Typography variant="body2" color="text.secondary">
                    المتاجر غير النشطة
                  </Typography>
                  <Typography variant="body2">{owner.inactiveStoreCount ?? 0}</Typography>
                </Box>
              </Box>
            </Paper>

            <Paper className="super-admin-detail-card" elevation={0}>
              <Typography variant="h6">المتاجر التابعة له</Typography>
              {owner.stores?.length ? (
                <Box className="super-admin-owner-store-list">
                  {owner.stores.map((store) => (
                    <Box key={store.id} className="super-admin-owner-store-card">
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Box>
                          <Typography variant="subtitle1">{store.name || "متجر"}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            /{store.slug || "بدون رابط"} - {store.customerCount ?? 0} عميل
                          </Typography>
                        </Box>
                        <AdminStatusChip active={store.isActive !== false} />
                      </Stack>

                      <Typography variant="body2" color="text.secondary">
                        {store.storeStory || "لا توجد قصة متجر مضافة بعد."}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography variant="caption" color="text.secondary">
                          واتساب: {store.whatsAppNumber || "-"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          تاريخ الإنشاء: {formatAdminDate(store.createdAt)}
                        </Typography>
                      </Stack>

                      <AdminContactAccounts accounts={store.contactAccounts || []} />

                      <Button
                        component={RouterLink}
                        to={`/dashboard/stores/${store.id}`}
                        variant="outlined"
                        size="small"
                      >
                        فتح تفاصيل المتجر
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  هذا المالك لا يملك متاجر بعد.
                </Typography>
              )}
            </Paper>
          </>
        ) : (
          <EmptyState
            title="اختر مالكًا"
            description="اختر مالكًا من الجدول لعرض متاجره وحسابات التواصل الخاصة بها."
          />
        )}
      </Box>
    </Drawer>
  );
}

export default function Owners() {
  const { notify } = useOutletContext();
  const ownersQuery = useSuperAdminOwners();
  const createOwnerMutation = useCreateOwnerAccount();
  const changePasswordMutation = useAdminChangeUserPassword();
  const updateStatusMutation = useUpdateSuperAdminOwnerStatus();

  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("stores-desc");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [passwordOwner, setPasswordOwner] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    owner: null,
    nextStatus: true,
  });

  const owners = useMemo(() => normalizeListResponse(ownersQuery.data), [ownersQuery.data]);
  const status = getHttpStatus(ownersQuery.error);

  const filteredOwners = useMemo(() => {
    const items = owners.filter((owner) => {
      const isActive = owner.isActive !== false;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return (
        matchesStatus &&
        (matchesSearch(buildDisplayName(owner), deferredSearchValue) ||
          matchesSearch(owner.email, deferredSearchValue))
      );
    });

    return sortOwners(items, sortBy);
  }, [deferredSearchValue, owners, sortBy, statusFilter]);

  const existingOwnerEmails = useMemo(
    () =>
      owners
        .map((owner) => String(owner?.email || "").trim().toLowerCase())
        .filter(Boolean),
    [owners],
  );

  const ownerColumns = [
    {
      key: "fullName",
      title: "المالك",
      render: (owner) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {buildDisplayName(owner, "مالك متجر")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {owner.email || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "isActive",
      title: "الحالة",
      render: (owner) => <AdminStatusChip active={owner.isActive !== false} />,
    },
    {
      key: "createdAt",
      title: "تاريخ الإنشاء",
      render: (owner) => formatAdminDate(owner.createdAt),
    },
    { key: "storeCount", title: "المتاجر" },
    { key: "activeStoreCount", title: "المتاجر النشطة" },
    { key: "inactiveStoreCount", title: "غير النشطة" },
    {
      key: "actions",
      title: "الإجراءات",
      render: (owner) => (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            startIcon={<VisibilityRoundedIcon fontSize="small" />}
            onClick={() => setSelectedOwner(owner)}
          >
            عرض
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LockResetRoundedIcon fontSize="small" />}
            onClick={() => setPasswordOwner(owner)}
          >
            كلمة المرور
          </Button>
          <AppButton
            size="small"
            variant="contained"
            appearance={owner.isActive !== false ? "destructive" : "primary"}
            onClick={() =>
              setStatusDialog({
                open: true,
                owner,
                nextStatus: owner.isActive === false,
              })
            }
          >
            {owner.isActive !== false ? "تعطيل" : "تفعيل"}
          </AppButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box className="super-admin-page">
      <Box className="super-admin-page__toolbar">
        <Box className="super-admin-page__toolbar-copy">
          <Typography variant="overline" className="super-admin-page__eyebrow">
            أصحاب المتاجر
          </Typography>
          <Typography variant="h5" className="super-admin-page__title">
            مستخدمو المنصة المرتبطون بالمتاجر
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ابحث محليًا بالاسم أو البريد، وافتح تفاصيل المتاجر التابعة لكل مالك، وتحكم
            بالتفعيل وكلمة المرور بدون تغيير أي عقد خلفي.
          </Typography>
        </Box>

        <Box className="super-admin-page__actions">
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            onClick={async () => {
              await ownersQuery.refetch();
              notify?.({ severity: "success", message: "تم تحديث قائمة الملاك." });
            }}
            disabled={ownersQuery.isFetching}
          >
            {ownersQuery.isFetching ? "جارٍ التحديث..." : "تحديث"}
          </Button>
          <AppButton
            startIcon={<PersonAddAlt1RoundedIcon fontSize="small" />}
            onClick={() => setCreateModalOpen(true)}
          >
            إنشاء مالك
          </AppButton>
        </Box>
      </Box>

      <Paper className="super-admin-panel" elevation={0}>
        <Box className="super-admin-page__filters">
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            placeholder="ابحث باسم المالك أو بريده الإلكتروني"
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

      {ownersQuery.isLoading ? <OwnersSkeleton /> : null}

      {!ownersQuery.isLoading && ownersQuery.isError ? (
        status === 403 ? (
          <EmptyState
            title="ليس لديك صلاحية"
            description="الحساب الحالي غير مخول لإدارة حسابات أصحاب المتاجر."
          />
        ) : status === 404 ? (
          <EmptyState
            title="لا يوجد ملاك بعد"
            description="لم تُرجع الـ API أي حسابات StoreOwner حتى الآن."
            action={
              <AppButton onClick={() => setCreateModalOpen(true)}>إنشاء أول مالك</AppButton>
            }
          />
        ) : (
          <Alert severity="error">
            {extractApiError(ownersQuery.error, "تعذر تحميل قائمة الملاك حاليًا.")}
          </Alert>
        )
      ) : null}

      {!ownersQuery.isLoading && !ownersQuery.isError ? (
        <Paper className="super-admin-panel super-admin-table-card" elevation={0}>
          <Box className="super-admin-panel__head">
            <Box>
              <Typography variant="h6" className="super-admin-panel__title">
                قائمة الملاك
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredOwners.length} حساب بعد تطبيق البحث والفلترة المحلية.
              </Typography>
            </Box>
          </Box>

          <AppDataTable
            rows={filteredOwners}
            columns={ownerColumns}
            emptyState={
              <EmptyState
                title="لا يوجد نتائج مطابقة"
                description="جرّب عبارة بحث مختلفة أو غيّر فلتر الحالة."
              />
            }
          />
        </Paper>
      ) : null}

      <CreateOwnerModal
        open={createModalOpen}
        loading={createOwnerMutation.isPending}
        error={createOwnerMutation.error}
        existingEmails={existingOwnerEmails}
        onClose={() => {
          createOwnerMutation.reset();
          setCreateModalOpen(false);
        }}
        onSubmit={async (values) => {
          await createOwnerMutation.mutateAsync({
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            password: values.password,
          });

          notify?.({
            severity: "success",
            message: "تم إنشاء المالك بنجاح. قد يحتاج إلى تأكيد بريده الإلكتروني قبل أول دخول.",
          });
          setCreateModalOpen(false);
        }}
      />

      <ChangePasswordModal
        owner={passwordOwner}
        open={Boolean(passwordOwner)}
        loading={changePasswordMutation.isPending}
        error={changePasswordMutation.error}
        onClose={() => {
          changePasswordMutation.reset();
          setPasswordOwner(null);
        }}
        onSubmit={async (values) => {
          if (!passwordOwner?.id) {
            return;
          }

          await changePasswordMutation.mutateAsync({
            userId: passwordOwner.id,
            newPassword: values.newPassword,
          });

          notify?.({
            severity: "success",
            message: `تم تحديث كلمة المرور للحساب ${buildDisplayName(passwordOwner)}.`,
          });
          setPasswordOwner(null);
        }}
      />

      <OwnerDetailsDrawer
        open={Boolean(selectedOwner)}
        ownerId={selectedOwner?.id}
        fallbackOwner={selectedOwner}
        onClose={() => setSelectedOwner(null)}
      />

      <AdminConfirmDialog
        open={statusDialog.open}
        title={`${statusDialog.nextStatus ? "تفعيل" : "تعطيل"} المالك`}
        description={
          statusDialog.owner
            ? `هل أنت متأكد من ${statusDialog.nextStatus ? "تفعيل" : "تعطيل"} الحساب ${buildDisplayName(statusDialog.owner)}؟`
            : "هل أنت متأكد؟"
        }
        confirmLabel={statusDialog.nextStatus ? "تفعيل المالك" : "تعطيل المالك"}
        confirmColor={statusDialog.nextStatus ? "primary" : "warning"}
        loading={updateStatusMutation.isPending}
        onClose={() =>
          setStatusDialog({
            open: false,
            owner: null,
            nextStatus: true,
          })
        }
        onConfirm={async () => {
          if (!statusDialog.owner?.id) {
            return;
          }

          await updateStatusMutation.mutateAsync({
            ownerId: statusDialog.owner.id,
            payload: {
              isActive: statusDialog.nextStatus,
            },
          });

          notify?.({
            severity: "success",
            message: `${buildDisplayName(statusDialog.owner)} أصبح الآن ${
              statusDialog.nextStatus ? "نشطًا" : "غير نشط"
            }.`,
          });
          setStatusDialog({
            open: false,
            owner: null,
            nextStatus: true,
          });
        }}
      />
    </Box>
  );
}
