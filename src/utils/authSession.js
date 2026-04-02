import { jwtDecode } from "jwt-decode";

const roleKeys = [
  "role",
  "roles",
  "Role",
  "Roles",
  "userRole",
  "userRoles",
  "accountRole",
  "accountType",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

function pickFirstValue(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const firstItem = value.find(Boolean);
      if (firstItem) return firstItem;
      continue;
    }

    if (value !== null && value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
}

function coerceRoleValue(value) {
  if (Array.isArray(value)) {
    return coerceRoleValue(value.find(Boolean));
  }

  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object") {
    return String(
      value.name ||
        value.value ||
        value.role ||
        value.code ||
        value.displayName ||
        value.title ||
        "",
    );
  }

  return String(value);
}

export function extractToken(data) {
  return (
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.data?.token ||
    data?.data?.accessToken ||
    ""
  );
}

export function extractUser(data) {
  return data?.user || data?.data?.user || data?.owner || data?.data?.owner || null;
}

export function extractRole(data, token, user) {
  const directCandidates = [
    data?.role,
    data?.data?.role,
    user?.role,
    user?.roles,
    user?.userRole,
    user?.accountRole,
    user?.accountType,
  ];

  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      directCandidates.push(...roleKeys.map((key) => decodedToken?.[key]));
    } catch {
      // Ignore malformed tokens and fall back to response data.
    }
  }

  return coerceRoleValue(pickFirstValue(...directCandidates));
}
