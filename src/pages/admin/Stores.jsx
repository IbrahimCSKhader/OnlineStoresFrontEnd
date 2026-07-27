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
import { STORE_THEME_TEMPLATES } from "../../constants/storeThemeTemplates.js";
import "./SuperAdminPages.css";

const STATUS_OPTIONS = [
  { value: "all", label: "ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ" },
  { value: "active", label: "ط§ظ„ظ†ط´ط·ط© ظپظ‚ط·" },
  { value: "inactive", label: "ط؛ظٹط± ط§ظ„ظ†ط´ط·ط© ظپظ‚ط·" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "ط§ظ„ط£ط­ط¯ط« ط£ظˆظ„ظ‹ط§" },
  { value: "oldest", label: "ط§ظ„ط£ظ‚ط¯ظ… ط£ظˆظ„ظ‹ط§" },
  { value: "customers-desc", label: "ط§ظ„ط£ظƒط«ط± ط¹ظ…ظ„ط§ط،" },
  { value: "name-asc", label: "ط§ظ„ط§ط³ظ… ط£ - ظٹ" },
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
    themeTemplate: "D",
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
          <Typography variant="h6">ط¥ظ†ط´ط§ط، ظ…طھط¬ط± ط¬ط¯ظٹط¯</Typography>
          <Typography variant="body2" color="text.secondary">
            ظٹظ…ظƒظ†ظƒ ط¥ظ†ط´ط§ط، ظ…طھط¬ط± ظ…ظ† ظ‡ظ†ط§طŒ ظ„ظƒظ† ط§ظ„ط¨ط§ظƒ ط¥ظ†ط¯ ط§ظ„ط­ط§ظ„ظٹ ظ„ط§ ظٹطھظٹط­ ط§ط®طھظٹط§ط± ظ…ط§ظ„ظƒ ظ…ط®طھظ„ظپ ظˆظ‚طھ
            ط§ظ„ط¥ظ†ط´ط§ط،ط› ظ„ط°ظ„ظƒ ط³ظٹط±ط¨ط·ظ‡ ط¨ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ…ط³ط¬ظ„ ط¯ط®ظˆظ„ظ‡ ط­ط§ظ„ظٹظ‹ط§.
          </Typography>
        </Box>

        <Alert severity="warning">
          ط§ط®طھظٹط§ط± ط§ظ„ظ…ط§ظ„ظƒ ط؛ظٹط± ظ…طھط§ط­ ط­ط§ظ„ظٹظ‹ط§ ظ…ظ† ظ‡ط°ظ‡ ط§ظ„ظ€ API. ط£ط±ط³ظ„ ظپظ‚ط· ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…طھط¬ط± ط§ظ„ط£ط³ط§ط³ظٹط©
          ظˆط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„ ط§ظ„ط§ط®طھظٹط§ط±ظٹط©.
        </Alert>

        {error ? (
          <Alert severity="error">{extractApiError(error, "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ…طھط¬ط± ط­ط§ظ„ظٹظ‹ط§.")}</Alert>
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
            label="ط§ط³ظ… ط§ظ„ظ…طھط¬ط±"
            value={form.name}
            required
            onChange={(event) => updateForm("name", event.target.value)}
          />
          <AppTextField
            label="ط±ط§ط¨ط· ط§ظ„ظ…طھط¬ط±"
            value={form.slug}
            required
            helperText={`ط§ظ„ط±ط§ط¨ط· ط§ظ„ط­ط§ظ„ظٹ: /${slugPreview || "store"}`}
            onChange={(event) => updateForm("slug", event.target.value)}
          />
          <AppTextField
            label="ظ†ظˆط¹ ط§ظ„ظ†ط´ط§ط·"
            value={form.businessType}
            onChange={(event) => updateForm("businessType", event.target.value)}
          />
          <AppTextField
            label="ط±ظ‚ظ… ظˆط§طھط³ط§ط¨"
            value={form.whatsAppNumber}
            onChange={(event) => updateForm("whatsAppNumber", event.target.value)}
          />
          <AppTextField
            label="ط§ظ„ظˆطµظپ"
            multiline
            minRows={3}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            sx={{ gridColumn: "1 / -1" }}
          />
          <AppTextField
            label="ظ‚طµط© ط§ظ„ظ…طھط¬ط±"
            multiline
            minRows={4}
            value={form.storeStory}
            onChange={(event) => updateForm("storeStory", event.target.value)}
            sx={{ gridColumn: "1 / -1" }}
          />

          <AppTextField
            select
            label="قالب المتجر"
            value={form.themeTemplate}
            onChange={(event) => updateForm("themeTemplate", event.target.value)}
            helperText="كل قالب يملك لايت مود ودارك مود داخل واجهة المتجر."
          >
            {STORE_THEME_TEMPLATES.map((template) => (
              <MenuItem key={template.value} value={template.value}>
                {template.label}
              </MenuItem>
            ))}
          </AppTextField>

          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Typography variant="subtitle2">ط´ط¹ط§ط± ط§ظ„ظ…طھط¬ط±</Typography>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(event) => updateForm("logoFile", event.target.files?.[0] || null)}
            />
          </Box>

          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Typography variant="subtitle2">طµظˆط±ط© ط§ظ„ط؛ظ„ط§ظپ</Typography>
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
                <Typography variant="subtitle1">ط­ط³ط§ط¨ط§طھ ط§ظ„طھظˆط§طµظ„</Typography>
                <Typography variant="body2" color="text.secondary">
                  ط§ظ„ظ…ظ†طµط© ظˆط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظ‚ط·. ظٹظ…ظƒظ† طھظƒط±ط§ط± ظ†ظپط³ ط§ظ„ظ…ظ†طµط© ط£ظƒط«ط± ظ…ظ† ظ…ط±ط©.
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
                ط¥ط¶ط§ظپط© ط­ط³ط§ط¨
              </Button>
            </Stack>

            {form.contactAccounts.length ? (
              form.contactAccounts.map((account, index) => (
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
                ظ„ظ† ظٹطھظ… ط¥ط±ط³ط§ظ„ ط£ظٹ ط­ط³ط§ط¨ طھظˆط§طµظ„ ظ…ط§ ظ„ظ… طھط¶ظپظ‡ ظ…ظ† ظ‡ظ†ط§.
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
              ط¥ظ„ط؛ط§ط،
            </Button>
            <AppButton type="submit" loading={loading}>
              ط¥ظ†ط´ط§ط، ط§ظ„ظ…طھط¬ط±
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
      title: "ط§ظ„ظ…طھط¬ط±",
      render: (store) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {store.name || "ظ…طھط¬ط±"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            /{store.slug || "ط¨ط¯ظˆظ† ط±ط§ط¨ط·"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "owner",
      title: "ط§ظ„ظ…ط§ظ„ظƒ",
      render: (store) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" fontWeight={700}>
            {buildDisplayName(store.owner, "ط¨ط¯ظˆظ† ظ…ط§ظ„ظƒ")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {store.owner?.email || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      key: "businessType",
      title: "ظ†ظˆط¹ ط§ظ„ظ†ط´ط§ط·",
      render: (store) => store.businessType || "-",
    },
    {
      key: "isActive",
      title: "ط§ظ„ط­ط§ظ„ط©",
      render: (store) => <AdminStatusChip active={store.isActive !== false} />,
    },
    { key: "customerCount", title: "ط§ظ„ط¹ظ…ظ„ط§ط،" },
    {
      key: "createdAt",
      title: "طھط§ط±ظٹط® ط§ظ„ط¥ظ†ط´ط§ط،",
      render: (store) => formatAdminDate(store.createdAt),
    },
    {
      key: "actions",
      title: "ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ",
      render: (store) => (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            component={RouterLink}
            to={`/dashboard/stores/${store.id}`}
            size="small"
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon fontSize="small" />}
          >
            ظپطھط­
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
            {store.isActive !== false ? "طھط¹ط·ظٹظ„" : "طھظپط¹ظٹظ„"}
          </AppButton>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
            onClick={() => setDeleteDialog({ open: true, store })}
          >
            ط­ط°ظپ
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
            ط§ظ„ظ…طھط§ط¬ط±
          </Typography>
          <Typography variant="h5" className="super-admin-page__title">
            ط¬ظ…ظٹط¹ ظ…طھط§ط¬ط± ط§ظ„ظ…ظ†طµط© ظپظٹ ظ…ظƒط§ظ† ظˆط§ط­ط¯
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ط§ط¨ط­ط« ظˆط§ظپط±ط² ظ…ط­ظ„ظٹظ‹ط§طŒ ظˆط§ظپطھط­ طھظپط§طµظٹظ„ ط£ظٹ ظ…طھط¬ط±طŒ ظˆطھط­ظƒظ… ط¨ط§ظ„طھظپط¹ظٹظ„ ط£ظˆ ط§ظ„ط­ط°ظپ ط§ظ„ظ†ط§ط¹ظ… ظ…ظ† ظ†ظپط³
            ط§ظ„ط´ط§ط´ط©.
          </Typography>
        </Box>

        <Box className="super-admin-page__actions">
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon fontSize="small" />}
            onClick={async () => {
              await storesQuery.refetch();
              notify?.({ severity: "success", message: "طھظ… طھط­ط¯ظٹط« ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…طھط§ط¬ط±." });
            }}
            disabled={storesQuery.isFetching}
          >
            {storesQuery.isFetching ? "ط¬ط§ط±ظچ ط§ظ„طھط­ط¯ظٹط«..." : "طھط­ط¯ظٹط«"}
          </Button>
          <AppButton
            startIcon={<AddRoundedIcon fontSize="small" />}
            onClick={() => setCreateModalOpen(true)}
          >
            ط¥ظ†ط´ط§ط، ظ…طھط¬ط±
          </AppButton>
        </Box>
      </Box>

      <Alert severity="info" icon={<StorefrontRoundedIcon fontSize="inherit" />}>
        ظٹظ…ظƒظ†ظƒ ط¥ظ†ط´ط§ط، ظ…طھط¬ط± ظ…ظ† ط§ظ„ط³ظˆط¨ط± ط£ط¯ظ…ظ† ط§ظ„ط¢ظ†طŒ ظ„ظƒظ† طھط¹ظٹظٹظ† ط§ظ„ظ…ط§ظ„ظƒ ظ…ط§ ط²ط§ظ„ ظ…ط­ط¯ظˆط¯ظ‹ط§ ظ…ظ† ط¬ظ‡ط© ط§ظ„ط¨ط§ظƒ
        ط¥ظ†ط¯: ظ‚ظٹظ…ط© <code>OwnerId</code> ظ„ط§ طھظڈط³طھط®ط¯ظ… ط­ط§ظ„ظٹظ‹ط§ ط¹ظ†ط¯ ط§ظ„ط¥ظ†ط´ط§ط،.
      </Alert>

      <Paper className="super-admin-panel" elevation={0}>
        <Box className="super-admin-page__filters">
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            placeholder="ط§ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ظ…طھط¬ط± ط£ظˆ ط§ظ„ط±ط§ط¨ط· ط£ظˆ ظ†ظˆط¹ ط§ظ„ظ†ط´ط§ط· ط£ظˆ ط§ط³ظ… ط§ظ„ظ…ط§ظ„ظƒ"
          />
          <AppTextField
            select
            size="small"
            sx={{ minWidth: 170 }}
            label="ط§ظ„ط­ط§ظ„ط©"
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
            label="ط§ظ„ظپط±ط²"
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
          {extractApiError(createStoreMutation.error, "طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„ظ…طھط¬ط± ط­ط§ظ„ظٹظ‹ط§.")}
        </Alert>
      ) : null}

      {!storesQuery.isLoading && !storesQuery.isError ? (
        <Paper className="super-admin-panel super-admin-table-card" elevation={0}>
          <Box className="super-admin-panel__head">
            <Box>
              <Typography variant="h6" className="super-admin-panel__title">
                ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…طھط§ط¬ط±
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredStores.length} ظ…طھط¬ط± ط¨ط¹ط¯ طھط·ط¨ظٹظ‚ ط§ظ„ط¨ط­ط« ظˆط§ظ„ظپظ„طھط±ط© ط§ظ„ظ…ط­ظ„ظٹط©.
              </Typography>
            </Box>
          </Box>

          <AppDataTable
            rows={filteredStores}
            columns={columns}
            emptyState={
              <EmptyState
                title="ظ„ط§ طھظˆط¬ط¯ ظ…طھط§ط¬ط± ظ…ط·ط§ط¨ظ‚ط©"
                description="ط¬ط±ظ‘ط¨ ط¹ط¨ط§ط±ط© ط¨ط­ط« ظ…ط®طھظ„ظپط© ط£ظˆ ط؛ظٹظ‘ط± ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظپظ„طھط±ط©."
              />
            }
          />
        </Paper>
      ) : null}

      {!storesQuery.isLoading && storesQuery.isError ? (
        status === 403 ? (
          <EmptyState
            title="ظ„ظٹط³ ظ„ط¯ظٹظƒ طµظ„ط§ط­ظٹط©"
            description="ط§ظ„ط­ط³ط§ط¨ ط§ظ„ط­ط§ظ„ظٹ ط؛ظٹط± ظ…ط®ظˆظ„ ظ„ط¹ط±ط¶ ظ‚ط§ط¦ظ…ط© ظ…طھط§ط¬ط± ط§ظ„ط³ظˆط¨ط± ط£ط¯ظ…ظ†."
          />
        ) : status === 404 ? (
          <EmptyState
            title="ظ„ط§ طھظˆط¬ط¯ ظ…طھط§ط¬ط±"
            description="ط§ظ„ظ€ API ظ„ظ… طھظڈط±ط¬ط¹ ظ…طھط§ط¬ط± ظ„ظ„ط¯ط§ط´ط¨ظˆط±ط¯ ط­طھظ‰ ط§ظ„ط¢ظ†."
          />
        ) : (
          <Alert severity="error">
            {extractApiError(storesQuery.error, "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…طھط§ط¬ط± ط­ط§ظ„ظٹظ‹ط§.")}
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
            message: "طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ…طھط¬ط± ط¨ظ†ط¬ط§ط­.",
          });
          setCreateModalOpen(false);
        }}
      />

      <AdminConfirmDialog
        open={statusDialog.open}
        title={`${statusDialog.nextStatus ? "طھظپط¹ظٹظ„" : "طھط¹ط·ظٹظ„"} ط§ظ„ظ…طھط¬ط±`}
        description={
          statusDialog.store
            ? `ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ${statusDialog.nextStatus ? "طھظپط¹ظٹظ„" : "طھط¹ط·ظٹظ„"} ${statusDialog.store.name || "ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"}طں`
            : "ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯طں"
        }
        confirmLabel={statusDialog.nextStatus ? "طھظپط¹ظٹظ„ ط§ظ„ظ…طھط¬ط±" : "طھط¹ط·ظٹظ„ ط§ظ„ظ…طھط¬ط±"}
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
            message: `${statusDialog.store.name || "ط§ظ„ظ…طھط¬ط±"} ط£طµط¨ط­ ${
              statusDialog.nextStatus ? "ظ†ط´ط·ظ‹ط§" : "ط؛ظٹط± ظ†ط´ط·"
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
        title="ط­ط°ظپ ط§ظ„ظ…طھط¬ط±"
        description={
          deleteDialog.store
            ? `ط³ظٹطھظ… ط­ط°ظپ ${deleteDialog.store.name || "ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±"} ط­ط°ظپظ‹ط§ ظ†ط§ط¹ظ…ظ‹ط§. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں`
            : "ط³ظٹطھظ… ط­ط°ظپ ط§ظ„ظ…طھط¬ط± ط§ظ„ط­ط§ظ„ظٹ ط­ط°ظپظ‹ط§ ظ†ط§ط¹ظ…ظ‹ط§. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں"
        }
        confirmLabel="ط­ط°ظپ ط§ظ„ظ…طھط¬ط±"
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
            message: `طھظ… ط­ط°ظپ ${deleteDialog.store.name || "ط§ظ„ظ…طھط¬ط±"}.`,
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

