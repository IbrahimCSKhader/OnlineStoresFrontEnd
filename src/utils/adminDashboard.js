export function getHttpStatus(error) {
  const status = Number(error?.response?.status || error?.status || 0);
  return Number.isFinite(status) ? status : 0;
}

export function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function matchesSearch(value, query) {
  if (!query) {
    return true;
  }

  return normalizeSearchValue(value).includes(normalizeSearchValue(query));
}

export function formatAdminDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "-";
  }

  return parsedValue.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminDate(value) {
  if (!value) {
    return "-";
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return "-";
  }

  return parsedValue.toLocaleDateString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatAdminNumber(value, fallback = 0) {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? amount.toLocaleString("ar") : String(fallback);
}

export function buildDisplayName(entity, fallback = "غير معروف") {
  const firstName = String(entity?.firstName || "").trim();
  const lastName = String(entity?.lastName || "").trim();
  const fullName = String(entity?.fullName || "").trim();

  return fullName || `${firstName} ${lastName}`.trim() || entity?.email || fallback;
}

export function getInitials(value, fallback = "سا") {
  const source = String(value || "").trim();

  if (!source) {
    return fallback;
  }

  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]).join("");

  return (initials || source.slice(0, 2)).toUpperCase();
}
