import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import authApi from "../../API/auth.api.js";
import storeApi from "../../API/store.api.js";
import extractApiError from "../../utils/extractApiError.js";
import "./StoreRegister.css";

const CONTACT_PLATFORMS = [
  "Instagram",
  "TikTok",
  "Facebook",
  "Snapchat",
  "WhatsApp",
  "YouTube",
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  storeName: "",
  slug: "",
  description: "",
  businessType: "",
  whatsAppNumber: "",
};

const emptyContact = () => ({
  platform: "Instagram",
  value: "",
  label: "",
});

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function stripUrlParts(value) {
  return value.split(/[?#]/)[0].replace(/\/+$/g, "");
}

function parseUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}

function cleanHandle(value) {
  return value.trim().replace(/^@+/, "").replace(/^\/+|\/+$/g, "");
}

function normalizeSocialAccount(platform, rawValue) {
  const value = rawValue.trim();
  if (!value) return "";

  if (platform === "WhatsApp") {
    return value.replace(/\D/g, "");
  }

  const parsedUrl = parseUrl(value);
  const host = parsedUrl?.hostname.replace(/^www\./i, "").toLowerCase() || "";
  const path = parsedUrl ? decodeURIComponent(stripUrlParts(parsedUrl.pathname)) : "";

  if (platform === "Instagram" && host.includes("instagram.com")) {
    return cleanHandle(path.split("/").filter(Boolean)[0] || "");
  }

  if (platform === "TikTok" && host.includes("tiktok.com")) {
    return cleanHandle(path.split("/").filter(Boolean)[0] || "");
  }

  if (platform === "Facebook" && host.includes("facebook.com")) {
    if (parsedUrl.searchParams.get("id")) return parsedUrl.searchParams.get("id");
    return cleanHandle(path.split("/").filter(Boolean).join("/"));
  }

  if (platform === "Snapchat" && host.includes("snapchat.com")) {
    const parts = path.split("/").filter(Boolean);
    return cleanHandle(parts[0]?.toLowerCase() === "add" ? parts[1] || "" : parts[0] || "");
  }

  if (platform === "YouTube" && (host.includes("youtube.com") || host.includes("youtu.be"))) {
    if (host.includes("youtu.be")) return cleanHandle(path);
    const parts = path.split("/").filter(Boolean);
    if (parts[0]?.startsWith("@")) return cleanHandle(parts[0]);
    if (["channel", "c", "user"].includes(parts[0]?.toLowerCase())) {
      return parts.slice(0, 2).join("/");
    }
    return cleanHandle(parts[0] || "");
  }

  return cleanHandle(value);
}

function getContactError(contact) {
  if (!CONTACT_PLATFORMS.includes(contact.platform)) {
    return "اختار منصة صحيحة.";
  }

  if (!contact.value.trim()) {
    return "";
  }

  const normalized = normalizeSocialAccount(contact.platform, contact.value);

  if (!normalized) {
    return "الحساب غير واضح، أدخل يوزر أو رابط صحيح.";
  }

  if (contact.platform === "WhatsApp" && normalized.length < 8) {
    return "رقم واتساب لازم يحتوي 8 أرقام على الأقل.";
  }

  if (contact.platform !== "WhatsApp" && /\s/.test(normalized)) {
    return "الحساب لا يجب أن يحتوي مسافات.";
  }

  return "";
}

function validateForm(form, contacts) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = "الاسم الأول مطلوب.";
  if (!form.lastName.trim()) errors.lastName = "اسم العائلة مطلوب.";
  if (!/\S+@\S+\.\S+/.test(form.email.trim())) errors.email = "أدخل بريد إلكتروني صحيح.";
  if (form.password.length < 8) errors.password = "كلمة المرور لازم تكون 8 أحرف على الأقل.";
  if (!form.storeName.trim()) errors.storeName = "اسم المتجر مطلوب.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
    errors.slug = "الرابط يقبل أحرف إنجليزية صغيرة، أرقام، وشرطة بين الكلمات.";
  }

  const seenContacts = new Set();
  contacts.forEach((contact, index) => {
    const error = getContactError(contact);
    const normalized = normalizeSocialAccount(contact.platform, contact.value);
    const key = `${contact.platform}:${normalized}`.toLowerCase();

    if (error) {
      errors[`contact-${index}`] = error;
    } else if (normalized && seenContacts.has(key)) {
      errors[`contact-${index}`] = "هذا الحساب مكرر.";
    }

    if (normalized) seenContacts.add(key);
  });

  return errors;
}

function buildStoreLink(slug) {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://mawja.site";

  return `${origin.replace(/\/$/g, "")}/market/${encodeURIComponent(slug)}`;
}

export default function StoreRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [contacts, setContacts] = useState([emptyContact()]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [createdOwner, setCreatedOwner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const normalizedContacts = useMemo(
    () =>
      contacts
        .map((contact, index) => ({
          platform: contact.platform,
          username: normalizeSocialAccount(contact.platform, contact.value),
          label: contact.label.trim(),
          sortOrder: index,
        }))
        .filter((contact) => contact.username),
    [contacts],
  );

  function updateForm(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "storeName" && !slugEdited) {
        next.slug = slugify(value);
      }

      return next;
    });

    if (["firstName", "lastName", "email", "password"].includes(key)) {
      setCreatedOwner(null);
    }
  }

  function updateContact(index, key, value) {
    setContacts((current) =>
      current.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [key]: value } : contact,
      ),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError("");

    const nextErrors = validateForm(form, contacts);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const owner =
        createdOwner ||
        (await authApi.createOwner({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        }));

      setCreatedOwner(owner);

      const store = await storeApi.createStore({
        name: form.storeName.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        businessType: form.businessType.trim(),
        whatsAppNumber: form.whatsAppNumber.trim(),
        ownerId: owner.id,
        contactAccounts: normalizedContacts,
      });

      const storeLink = buildStoreLink(store?.slug || form.slug.trim());

      navigate("/auth/verify-email", {
        replace: true,
        state: {
          email: form.email.trim(),
          redirectTo: "/owner",
          storeLink,
          storeName: store?.name || form.storeName.trim(),
          message: "تم إنشاء حساب صاحب المتجر والمتجر. أدخل كود التحقق الذي وصل إلى بريدك.",
        },
      });
    } catch (error) {
      setApiError(extractApiError(error, "تعذر إنشاء المتجر حاليًا. راجع البيانات وحاول مرة أخرى."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box className="store-register">
      <Paper className="store-register__panel" elevation={0}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Box className="store-register__header">
            <Chip icon={<StorefrontRoundedIcon />} label="Mawja" className="store-register__chip" />
            <Typography variant="h3" className="store-register__title">
              إنشاء متجر
            </Typography>
            <Typography color="text.secondary">
              أدخل بيانات صاحب المتجر والمتجر، وبعدها سيتم تحويلك مباشرة لتأكيد البريد.
            </Typography>
          </Box>

          {apiError ? <Alert severity="error">{apiError}</Alert> : null}

          <Box className="store-register__grid">
            <TextField
              label="الاسم الأول"
              placeholder="مثال: أحمد"
              value={form.firstName}
              onChange={(event) => updateForm("firstName", event.target.value)}
              error={Boolean(errors.firstName)}
              helperText={errors.firstName || "اكتب اسم صاحب المتجر الأول كما سيظهر في الحساب."}
              fullWidth
            />
            <TextField
              label="اسم العائلة"
              placeholder="مثال: خالد"
              value={form.lastName}
              onChange={(event) => updateForm("lastName", event.target.value)}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName || "اكتب اسم العائلة لصاحب المتجر."}
              fullWidth
            />
            <TextField
              label="البريد الإلكتروني"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email || "سيتم إرسال كود تأكيد البريد على هذا الإيميل."}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
              fullWidth
            />
            <TextField
              label="كلمة المرور"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password || "لا تقل عن 8 أحرف، وسيستخدمها صاحب المتجر لتسجيل الدخول."}
              placeholder="8 أحرف أو أكثر"
              type="password"
              autoComplete="new-password"
              fullWidth
            />
          </Box>

          <Divider />

          <Box className="store-register__grid">
            <TextField
              label="اسم المتجر"
              placeholder="مثال: متجر الموجة"
              value={form.storeName}
              onChange={(event) => updateForm("storeName", event.target.value)}
              error={Boolean(errors.storeName)}
              helperText={errors.storeName || "هذا الاسم سيظهر للزبائن داخل صفحة المتجر."}
              fullWidth
            />
            <TextField
              label="رابط المتجر"
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                updateForm("slug", slugify(event.target.value));
              }}
              error={Boolean(errors.slug)}
              helperText={
                errors.slug ||
                `اكتب اسم الرابط بالإنجليزي فقط. مثال: my-store. سيظهر المتجر على ${buildStoreLink(form.slug || "my-store")}`
              }
              placeholder="my-store"
              InputProps={{
                startAdornment: <LinkRoundedIcon fontSize="small" className="store-register__field-icon" />,
              }}
              fullWidth
            />
            <TextField
              label="نوع النشاط"
              value={form.businessType}
              onChange={(event) => updateForm("businessType", event.target.value)}
              placeholder="ملابس، مطعم، هدايا..."
              helperText="اختياري، يساعد في وصف مجال المتجر."
              fullWidth
            />
            <TextField
              label="رقم واتساب المتجر"
              value={form.whatsAppNumber}
              onChange={(event) => updateForm("whatsAppNumber", event.target.value)}
              placeholder="+970599123456"
              helperText="اكتب الرقم مع مقدمة الدولة وبدون مسافات قدر الإمكان. مثال: +970599123456."
              fullWidth
            />
            <TextField
              label="وصف قصير"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="اكتب وصفًا مختصرًا عن المنتجات أو الخدمات التي يقدمها المتجر."
              helperText="اختياري، يظهر للزبائن في صفحة المتجر."
              multiline
              minRows={3}
              className="store-register__wide"
              fullWidth
            />
          </Box>

          <Divider />

          <Stack spacing={2}>
            <Box className="store-register__section-head">
              <Box>
                <Typography variant="h6">حسابات السوشيال ميديا</Typography>
                <Typography variant="body2" color="text.secondary">
                  اكتب يوزر أو رابط كامل، وسيتم استخراج الحساب تلقائيًا.
                </Typography>
              </Box>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AddRoundedIcon />}
                onClick={() => setContacts((current) => [...current, emptyContact()])}
              >
                إضافة حساب
              </Button>
            </Box>

            {contacts.map((contact, index) => {
              const normalized = normalizeSocialAccount(contact.platform, contact.value);
              const contactError = errors[`contact-${index}`];

              return (
                <Box className="store-register__contact-row" key={`${index}-${contact.platform}`}>
                  <FormControl fullWidth>
                    <InputLabel>المنصة</InputLabel>
                    <Select
                      label="المنصة"
                      value={contact.platform}
                      onChange={(event) => updateContact(index, "platform", event.target.value)}
                    >
                      {CONTACT_PLATFORMS.map((platform) => (
                        <MenuItem key={platform} value={platform}>
                          {platform}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="يوزر أو رابط"
                    value={contact.value}
                    onChange={(event) => updateContact(index, "value", event.target.value)}
                    error={Boolean(contactError)}
                    helperText={
                      contactError ||
                      (normalized
                        ? `سيتم حفظه كـ ${normalized}`
                        : "اختياري. اكتب اليوزر مثل store_name أو رابط الحساب كامل.")
                    }
                    placeholder={
                      contact.platform === "WhatsApp"
                        ? "+970599123456"
                        : contact.platform === "Instagram"
                          ? "store_name أو https://instagram.com/store_name"
                          : contact.platform === "TikTok"
                            ? "@store_name أو https://tiktok.com/@store_name"
                            : contact.platform === "YouTube"
                              ? "@channel أو رابط قناة يوتيوب"
                              : "يوزر الحساب أو الرابط الكامل"
                    }
                    InputProps={{
                      startAdornment: <AlternateEmailRoundedIcon fontSize="small" className="store-register__field-icon" />,
                    }}
                    fullWidth
                  />
                  <TextField
                    label="اسم العرض"
                    value={contact.label}
                    onChange={(event) => updateContact(index, "label", event.target.value)}
                    placeholder="مثلاً: تابعنا"
                    helperText="اختياري، نص يظهر بدل اسم المنصة إذا حبيت."
                    fullWidth
                  />
                  <Tooltip title="حذف الحساب">
                    <span>
                      <IconButton
                        type="button"
                        aria-label="حذف الحساب"
                        onClick={() =>
                          setContacts((current) =>
                            current.length === 1
                              ? [emptyContact()]
                              : current.filter((_, contactIndex) => contactIndex !== index),
                          )
                        }
                      >
                        <DeleteRoundedIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              );
            })}
          </Stack>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
            startIcon={<StorefrontRoundedIcon />}
          >
            {isSubmitting ? "جاري إنشاء المتجر..." : "إنشاء المتجر"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
