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
import {
  getStoreThemeTemplateLabel,
  STORE_THEME_TEMPLATES,
} from "../../constants/storeThemeTemplates.js";
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
    themeTemplate: store?.themeTemplate || "D",
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
      <DialogTitle>طھط¹ط¯ظٹظ„ ط§ظ„ظ…طھط¬ط±</DialogTitle>
      <DialogContent dividers>
        <Box className="super-admin-panel" sx={{ p: 0 }}>
          <Typography variant="body2" color="text.secondary">
            ط¥ط±ط³ط§ظ„ ط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„ ظ‡ظ†ط§ ظٹط³طھط¨ط¯ظ„ ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط­ط§ظ„ظٹط© ط¨ط§ظ„ظƒط§ظ…ظ„ ظپظٹ ط§ظ„ط¨ط§ظƒ ط¥ظ†ط¯طŒ ظ„ط°ظ„ظƒ ط£ط¨ظ‚ظگ
            ظƒظ„ ط­ط³ط§ط¨ طھط±ظٹط¯ ط§ظ„ط­ظپط§ط¸ ط¹ظ„ظٹظ‡.
          </Typography>

          {error ? (
            <Alert severity="error">
              {extractApiError(error, "طھط¹ط°ط± طھط­ط¯ظٹط« ط§ظ„ظ…طھط¬ط± ط­ط§ظ„ظٹظ‹ط§.")}
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
              label="ط§ط³ظ… ط§ظ„ظ…طھط¬ط±"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <AppTextField
              label="ظ†ظˆط¹ ط§ظ„ظ†ط´ط§ط·"
              value={form.businessType}
              onChange={(event) =>
                setForm((current) => ({ ...current, businessType: event.target.value }))
              }
            />
            <AppTextField
              label="ط§ظ„ظˆطµظپ"
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              sx={{ gridColumn: "1 / -1" }}
            />
            <AppTextField
              label="ط±ط§ط¨ط· ط§ظ„ط´ط¹ط§ط±"
              value={form.logoUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, logoUrl: event.target.value }))
              }
            />
            <AppTextField
              label="ط±ط§ط¨ط· طµظˆط±ط© ط§ظ„ط؛ظ„ط§ظپ"
              value={form.coverImageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
              }
            />
            <AppTextField
              label="ط±ظ‚ظ… ظˆط§طھط³ط§ط¨"
              value={form.whatsAppNumber}
              onChange={(event) =>
                setForm((current) => ({ ...current, whatsAppNumber: event.target.value }))
              }
            />

            <AppTextField
              select
              label="قالب المتجر"
              value={form.themeTemplate}
              onChange={(event) =>
                setForm((current) => ({ ...current, themeTemplate: event.target.value }))
              }
              helperText="كل قالب يملك لايت مود ودارك مود داخل واجهة المتجر."
            >
              {STORE_THEME_TEMPLATES.map((template) => (
                <MenuItem key={template.value} value={template.value}>
                  {template.label}
                </MenuItem>
              ))}
            </AppTextField>
            <AppTextField
              label="ظ‚طµط© ط§ظ„ظ…طھط¬ط±"
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
                label="ط§ظ„ظ…طھط¬ط± ظ†ط´ط·"
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
                  <Typography variant="subtitle1">ط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ط§ظ„ظ…ظ†طµط© ظˆط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظ‚ط·. طھظƒط±ط§ط± ظ†ظپط³ ط§ظ„ظ…ظ†طµط© ظ…ط³ظ…ظˆط­.
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
                  ط¥ط¶ط§ظپط© ط­ط³ط§ط¨
                </Button>
              </Stack>

              {contactAccounts.length ? (
                contactAccounts.map((account, index) => (
                  <Box key={account.clientId} className="super-admin-contact-row">
                    <AppTextField
                      select
                      label="ط§ظ„ظ…ظ†طµط©"
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
                      label="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… / ط§ظ„ط±ظ‚ظ…"
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
                      label="ط§ظ„ط¹ظ†ظˆط§ظ†"
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
                      label="ط§ظ„طھط±طھظٹط¨"
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
                      ط­ط°ظپ
                    </Button>
                  </Box>
                ))
              ) : (
                <Box className="super-admin-empty-inline">
                  ظ„ظ† ظٹطھظ… ط¥ط±ط³ط§ظ„ ط£ظٹ ط­ط³ط§ط¨ط§طھ طھظˆط§طµظ„ ظ…ط§ ظ„ظ… طھط¶ظپظ‡ط§ ظ…ظ† ظ‡ظ†ط§.
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          ط¥ظ„ط؛ط§ط،
        </Button>
        <AppButton form="store-edit-form" loading={loading} type="submit">
          ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ
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
          (matchesSearch(buildDisplayName(customer, "ط¹ظ…ظٹظ„ ظ…طھط¬ط±"), deferredCustomersSearch) ||
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
      title: "ط§ظ„ط¹ظ…ظٹظ„",
      render: (customer) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {buildDisplayName(customer, "ط¹ظ…ظٹظ„ ظ…طھط¬ط±")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {customer.email || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "phone",
      title: "ط§ظ„ظ‡ط§طھظپ",
      render: (customer) => customer.phone || "-",
    },
    {
      key: "discountPercentage",
      title: "ط§ظ„ط®طµظ…",
      render: (customer) => `${Number(customer.discountPercentage ?? 0)}%`,
    },
    {
      key: "isActive",
      title: "ط§ظ„ط­ط§ظ„ط©",
      render: (customer) => <AdminStatusChip active={customer.isActive !== false} />,
    },
    {
      key: "createdAt",
      title: "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،",
      render: (customer) => formatAdminDate(customer.createdAt),
    },
    {
      key: "updatedAt",
      title: "ط¢ط®ط± طھط­ط¯ظٹط«",
      render: (customer) => formatAdminDate(customer.updatedAt),
    },
  ];

  return (
    <Box className="super-admin-page">
      <Box className="super-admin-page__toolbar">
        <Box className="super-admin-page__toolbar-copy">
          <Typography variant="overline" className="super-admin-page__eyebrow">
            ظ…ظ„ظپ ط§ظ„ظ…طھط¬ط±
          </Typography>
          <Typography variant="h5" className="super-admin-page__title">
            {store?.name || "طھظپط§طµظٹظ„ ط§ظ„ظ…طھط¬ط±"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ط±ط§ط¬ط¹ ظ…ظ„ظپ ط§ظ„ظ…طھط¬ط±طŒ ظˆط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط§ظ„ظƒطŒ ظˆط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„طŒ ظˆظ‚طµط© ط§ظ„ظ…طھط¬ط±طŒ ظˆط¹ظ…ظ„ط§ط، ط§ظ„ظ…طھط¬ط±.
          </Typography>
        </Box>

        <Box className="super-admin-page__actions">
          <Button
            component={RouterLink}
            to="/dashboard/stores"
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          >
            ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ ط§ظ„ظ…طھط§ط¬ط±
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            onClick={async () => {
              await storeQuery.refetch();

              if (activeTab === "customers") {
                await customersQuery.refetch();
              }

              notify?.({ severity: "success", message: "طھظ… طھط­ط¯ظٹط« طھظپط§طµظٹظ„ ط§ظ„ظ…طھط¬ط±." });
            }}
            disabled={storeQuery.isFetching || customersQuery.isFetching}
          >
            طھط­ط¯ظٹط«
          </Button>
        </Box>
      </Box>

      {storeQuery.isLoading ? <DetailSkeleton /> : null}

      {!storeQuery.isLoading && storeQuery.isError ? (
        storeStatus === 404 ? (
          <EmptyState
            title="ط§ظ„ظ…طھط¬ط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯"
            description="طھط¹ط°ط± ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ظ…طھط¬ط± ط§ظ„ظ…ط·ظ„ظˆط¨."
            action={
              <Button component={RouterLink} to="/dashboard/stores" variant="contained">
                ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ ط§ظ„ظ…طھط§ط¬ط±
              </Button>
            }
          />
        ) : storeStatus === 403 ? (
          <EmptyState
            title="ظ„ظٹط³ ظ„ط¯ظٹظƒ طµظ„ط§ط­ظٹط©"
            description="ط§ظ„ط­ط³ط§ط¨ ط§ظ„ط­ط§ظ„ظٹ ط؛ظٹط± ظ…ط®ظˆظ„ ظ„ط¹ط±ط¶ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±."
          />
        ) : (
          <Alert severity="error">
            {extractApiError(storeQuery.error, "طھط¹ط°ط± طھط­ظ…ظٹظ„ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط± ط­ط§ظ„ظٹظ‹ط§.")}
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
                    <Typography variant="h4">{store.name || "ظ…طھط¬ط±"}</Typography>
                    <AdminStatusChip active={store.isActive !== false} />
                  </Stack>
                  <Typography variant="body1" color="text.secondary">
                    /{store.slug || "ط¨ط¯ظˆظ† ط±ط§ط¨ط·"} - {store.businessType || "ط¨ط¯ظˆظ† ظ†ظˆط¹ ظ†ط´ط§ط·"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <AppButton
                    variant="outlined"
                    startIcon={<EditRoundedIcon fontSize="small" />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    طھط¹ط¯ظٹظ„ ط§ظ„ظ…طھط¬ط±
                  </AppButton>
                  <AppButton
                    variant="outlined"
                    appearance={store.isActive !== false ? "destructive" : "primary"}
                    onClick={() => setStatusDialogOpen(true)}
                  >
                    {store.isActive !== false ? "طھط¹ط·ظٹظ„" : "طھظپط¹ظٹظ„"}
                  </AppButton>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    ط­ط°ظپ
                  </Button>
                </Stack>
              </Stack>

              <Box className="super-admin-store-visual">
                {coverImage ? (
                  <img src={coverImage} alt={store.name || "ط؛ظ„ط§ظپ ط§ظ„ظ…طھط¬ط±"} />
                ) : (
                  <Box
                    sx={{
                      minHeight: 180,
                      display: "grid",
                      placeItems: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    ظ„ط§ طھظˆط¬ط¯ طµظˆط±ط© ط؛ظ„ط§ظپ
                  </Box>
                )}
              </Box>

              <Box className="super-admin-logo-row">
                {logoImage ? (
                  <img
                    src={logoImage}
                    alt={`${store.name || "ظ…طھط¬ط±"} logo`}
                    className="super-admin-logo-thumb"
                  />
                ) : (
                  <Box className="super-admin-logo-thumb super-admin-logo-thumb--empty">
                    {getInitials(store.name, "ظ…طھ")}
                  </Box>
                )}
                <Stack spacing={0.35}>
                  <Typography variant="subtitle1">{store.name || "ظ…طھط¬ط±"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ط§ظ„ط¹ظ…ظ„ط§ط،: {store.customerCount ?? 0}
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
              <Tab value="overview" label="ظ†ط¸ط±ط© ط¹ط§ظ…ط©" />
              <Tab
                value="customers"
                icon={<PeopleAltRoundedIcon fontSize="small" />}
                iconPosition="start"
                label="ط§ظ„ط¹ظ…ظ„ط§ط،"
              />
            </Tabs>

            {activeTab === "overview" ? (
              <Box className="super-admin-detail-grid">
                <Paper className="super-admin-detail-card" elevation={0}>
                  <Typography variant="h6">ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…طھط¬ط±</Typography>
                  <Box className="super-admin-info-list">
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        ط§ظ„ظˆطµظپ
                      </Typography>
                      <Typography variant="body2">{store.description || "-"}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        ط±ظ‚ظ… ظˆط§طھط³ط§ط¨
                      </Typography>
                      <Typography variant="body2">{store.whatsAppNumber || "-"}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        ط§ظ„ظ‚ط§ظ„ط¨
                      </Typography>
                      <Typography variant="body2">{getStoreThemeTemplateLabel(store.themeTemplate)}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،
                      </Typography>
                      <Typography variant="body2">{formatAdminDateTime(store.createdAt)}</Typography>
                    </Box>
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        ط¢ط®ط± طھط­ط¯ظٹط«
                      </Typography>
                      <Typography variant="body2">{formatAdminDateTime(store.updatedAt)}</Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper className="super-admin-detail-card" elevation={0}>
                  <Typography variant="h6">ط§ظ„ظ…ط§ظ„ظƒ</Typography>
                  <Box className="super-admin-info-list">
                    <Box className="super-admin-info-row">
                      <Typography variant="body2" color="text.secondary">
                        ط§ظ„ط§ط³ظ…
                      </Typography>
                      <Typography variant="body2">
                        {buildDisplayName(store.owner, "ط¨ط¯ظˆظ† ظ…ط§ظ„ظƒ")}
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
                        ط­ط§ظ„ط© ط§ظ„ظ…ط§ظ„ظƒ
                      </Typography>
                      <AdminStatusChip active={store.owner?.isActive !== false} />
                    </Box>
                  </Box>
                </Paper>

                <Paper className="super-admin-detail-card" elevation={0}>
                  <Typography variant="h6">ط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„</Typography>
                  <AdminContactAccounts accounts={store.contactAccounts || []} />
                </Paper>

                <Paper className="super-admin-story-card" elevation={0}>
                  <Typography variant="h6">ظ‚طµط© ط§ظ„ظ…طھط¬ط±</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {store.storeStory || "ظ„ظ… طھطھظ… ط¥ط¶ط§ظپط© ظ‚طµط© ظ„ظ„ظ…طھط¬ط± ط¨ط¹ط¯."}
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
                    placeholder="ط§ط¨ط­ط« ظپظٹ ط¹ظ…ظ„ط§ط، ط§ظ„ظ…طھط¬ط± ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ط¨ط±ظٹط¯ ط£ظˆ ط§ظ„ظ‡ط§طھظپ"
                  />
                  <AppTextField
                    select
                    size="small"
                    sx={{ minWidth: 170 }}
                    label="ط§ظ„ط­ط§ظ„ط©"
                    value={customersStatusFilter}
                    onChange={(event) => setCustomersStatusFilter(event.target.value)}
                  >
                    <MenuItem value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</MenuItem>
                    <MenuItem value="active">ط§ظ„ظ†ط´ط·ط© ظپظ‚ط·</MenuItem>
                    <MenuItem value="inactive">ط؛ظٹط± ط§ظ„ظ†ط´ط·ط© ظپظ‚ط·</MenuItem>
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
                      title="ظ‚ط§ط¦ظ…ط© ط§ظ„ط¹ظ…ظ„ط§ط، ط؛ظٹط± ظ…طھط§ط­ط©"
                      description="ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط± ظ„ط§ ظٹظ…ظ„ظƒ ظ‚ط§ط¦ظ…ط© ط¹ظ…ظ„ط§ط، ظ…طھط§ط­ط© ظ…ظ† endpoint ط§ظ„ط¯ط§ط´ط¨ظˆط±ط¯."
                    />
                  ) : customersStatus === 403 ? (
                    <EmptyState
                      title="ظ„ظٹط³ ظ„ط¯ظٹظƒ طµظ„ط§ط­ظٹط©"
                      description="ط§ظ„ط­ط³ط§ط¨ ط§ظ„ط­ط§ظ„ظٹ ط؛ظٹط± ظ…ط®ظˆظ„ ظ„ط¹ط±ط¶ ط¹ظ…ظ„ط§ط، ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±."
                    />
                  ) : (
                    <Alert severity="error">
                      {extractApiError(
                        customersQuery.error,
                        "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¹ظ…ظ„ط§ط، ط§ظ„ظ…طھط¬ط± ط­ط§ظ„ظٹظ‹ط§.",
                      )}
                    </Alert>
                  )
                ) : (
                  <AppDataTable
                    rows={filteredCustomers}
                    columns={customerColumns}
                    emptyState={
                      <EmptyState
                        title="ظ„ط§ ظٹظˆط¬ط¯ ط¹ظ…ظ„ط§ط، ظ…ط·ط§ط¨ظ‚ظˆظ†"
                        description="ط¬ط±ظ‘ط¨ ط¹ط¨ط§ط±ط© ط¨ط­ط« ظ…ط®طھظ„ظپط© ط£ظˆ ط؛ظٹظ‘ط± ظپظ„طھط± ط§ظ„ط­ط§ظ„ط©."
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
            message: `طھظ… طھط­ط¯ظٹط« ${store.name || "ط§ظ„ظ…طھط¬ط±"} ط¨ظ†ط¬ط§ط­.`,
          });
          setEditDialogOpen(false);
        }}
      />

      <AdminConfirmDialog
        open={statusDialogOpen}
        title={`${store?.isActive !== false ? "طھط¹ط·ظٹظ„" : "طھظپط¹ظٹظ„"} ط§ظ„ظ…طھط¬ط±`}
        description={
          store
            ? `ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ${store.isActive !== false ? "طھط¹ط·ظٹظ„" : "طھظپط¹ظٹظ„"} ${store.name || "ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"}طں`
            : "ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯طں"
        }
        confirmLabel={store?.isActive !== false ? "طھط¹ط·ظٹظ„ ط§ظ„ظ…طھط¬ط±" : "طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط±"}
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
            message: `${store.name || "ط§ظ„ظ…طھط¬ط±"} ط£طµط¨ط­ ط§ظ„ط¢ظ† ${
              store.isActive === false ? "ظ†ط´ط·ظ‹ط§" : "ط؛ظٹط± ظ†ط´ط·"
            }.`,
          });
          setStatusDialogOpen(false);
        }}
      />

      <AdminConfirmDialog
        open={deleteDialogOpen}
        title="ط­ط°ظپ ط§ظ„ظ…طھط¬ط±"
        description={
          store
            ? `ط³ظٹطھظ… ط­ط°ظپ ${store.name || "ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"} ط­ط°ظپظ‹ط§ ظ†ط§ط¹ظ…ظ‹ط§. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں`
            : "ط³ظٹطھظ… ط­ط°ظپ ط§ظ„ظ…طھط¬ط± ط§ظ„ط­ط§ظ„ظٹ ط­ط°ظپظ‹ط§ ظ†ط§ط¹ظ…ظ‹ط§. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں"
        }
        confirmLabel="ط­ط°ظپ ط§ظ„ظ…طھط¬ط±"
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
            message: `طھظ… ط­ط°ظپ ${store.name || "ط§ظ„ظ…طھط¬ط±"}.`,
          });
          navigate("/dashboard/stores", { replace: true });
        }}
      />
    </Box>
  );
}

