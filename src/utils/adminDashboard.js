import {
  formatUiDate,
  formatUiDateTime,
  formatUiNumber,
} from "./numberFormat.js";

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
  return formatUiDateTime(value);
}

export function formatAdminDate(value) {
  return formatUiDate(value);
}

export function formatAdminNumber(value, fallback = 0) {
  return formatUiNumber(value, {}, fallback);
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
