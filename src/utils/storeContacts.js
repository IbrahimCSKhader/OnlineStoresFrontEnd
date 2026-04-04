const STORE_CONTACT_PLATFORMS = {
  Instagram: "Instagram",
  TikTok: "TikTok",
  Facebook: "Facebook",
  Snapchat: "Snapchat",
  WhatsApp: "WhatsApp",
};

function normalizePlatform(platform) {
  const normalizedValue = String(platform || "").trim().toLowerCase();

  switch (normalizedValue) {
    case "instagram":
      return STORE_CONTACT_PLATFORMS.Instagram;
    case "tiktok":
    case "tik tok":
      return STORE_CONTACT_PLATFORMS.TikTok;
    case "facebook":
      return STORE_CONTACT_PLATFORMS.Facebook;
    case "snapchat":
    case "snap chat":
      return STORE_CONTACT_PLATFORMS.Snapchat;
    case "whatsapp":
    case "whats app":
      return STORE_CONTACT_PLATFORMS.WhatsApp;
    default:
      return "";
  }
}

export function normalizeWhatsAppIdentifier(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0")) {
    return `970${digits.slice(1)}`;
  }

  if (
    digits.length === 9 &&
    (digits.startsWith("59") || digits.startsWith("56"))
  ) {
    return `970${digits}`;
  }

  return digits;
}

export function normalizeStoreContactUsername(platform, username) {
  const normalizedPlatform = normalizePlatform(platform);
  const rawValue = String(username || "").trim();

  if (!normalizedPlatform || !rawValue) {
    return "";
  }

  if (normalizedPlatform === STORE_CONTACT_PLATFORMS.WhatsApp) {
    return normalizeWhatsAppIdentifier(rawValue);
  }

  return rawValue
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^tiktok\.com\/@/i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^snapchat\.com\/add\//i, "")
    .replace(/^wa\.me\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .trim();
}

export function buildStoreContactUrl(platform, username) {
  const normalizedPlatform = normalizePlatform(platform);
  const normalizedUsername = normalizeStoreContactUsername(platform, username);

  if (!normalizedPlatform || !normalizedUsername) {
    return "";
  }

  switch (normalizedPlatform) {
    case STORE_CONTACT_PLATFORMS.Instagram:
      return `https://www.instagram.com/${normalizedUsername}`;
    case STORE_CONTACT_PLATFORMS.TikTok:
      return `https://www.tiktok.com/@${normalizedUsername}`;
    case STORE_CONTACT_PLATFORMS.Facebook:
      return `https://www.facebook.com/${normalizedUsername}`;
    case STORE_CONTACT_PLATFORMS.Snapchat:
      return `https://www.snapchat.com/add/${normalizedUsername}`;
    case STORE_CONTACT_PLATFORMS.WhatsApp:
      return `https://wa.me/${normalizedUsername}`;
    default:
      return "";
  }
}

export function formatStoreContactValue(platform, username) {
  const normalizedPlatform = normalizePlatform(platform);
  const normalizedUsername = normalizeStoreContactUsername(platform, username);

  if (!normalizedPlatform || !normalizedUsername) {
    return "";
  }

  if (normalizedPlatform === STORE_CONTACT_PLATFORMS.WhatsApp) {
    return `+${normalizedUsername}`;
  }

  return `@${normalizedUsername}`;
}

export function getStoreContactEntries(store) {
  const rawAccounts = Array.isArray(store?.contactAccounts) ? store.contactAccounts : [];
  const accounts = [];
  const seenKeys = new Set();

  const pushEntry = ({
    id = "",
    platform = "",
    username = "",
    label = "",
    url = "",
    sortOrder = 0,
  }) => {
    const normalizedPlatform = normalizePlatform(platform);
    const normalizedUsername = normalizeStoreContactUsername(platform, username);

    if (!normalizedPlatform || !normalizedUsername) {
      return;
    }

    const dedupeKey = `${normalizedPlatform}:${normalizedUsername}`;
    if (seenKeys.has(dedupeKey)) {
      return;
    }

    seenKeys.add(dedupeKey);
    accounts.push({
      id: id || dedupeKey,
      platform: normalizedPlatform,
      username: normalizedUsername,
      label: String(label || "").trim(),
      url: String(url || "").trim() || buildStoreContactUrl(normalizedPlatform, normalizedUsername),
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      displayValue: formatStoreContactValue(normalizedPlatform, normalizedUsername),
    });
  };

  rawAccounts.forEach((account, index) => {
    pushEntry({
      id: account?.id || `${index}`,
      platform: account?.platform,
      username: account?.username,
      label: account?.label,
      url: account?.url,
      sortOrder: account?.sortOrder ?? index,
    });
  });

  const directWhatsAppNumber =
    store?.whatsAppNumber ||
    store?.whatsappNumber ||
    store?.WhatsAppNumber ||
    "";

  pushEntry({
    id: "store-whatsapp-number",
    platform: STORE_CONTACT_PLATFORMS.WhatsApp,
    username: directWhatsAppNumber,
    label: "واتساب",
    sortOrder: -1,
  });

  return accounts.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.platform.localeCompare(right.platform);
  });
}

export { STORE_CONTACT_PLATFORMS, normalizePlatform as normalizeStoreContactPlatform };
