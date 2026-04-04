function normalizeRoleKey(role) {
  if (!role) return "";

  const value = Array.isArray(role) ? (role.find(Boolean) ?? "") : String(role);
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}

export function isSuperAdminRole(role) {
  const normalizedRole = normalizeRoleKey(role);
  return normalizedRole === "superadmin";
}

export function isOwnerRole(role) {
  const normalizedRole = normalizeRoleKey(role);
  return normalizedRole === "owner" || normalizedRole === "storeowner";
}

export function isStoreCustomerRole(role) {
  const normalizedRole = normalizeRoleKey(role);
  return normalizedRole === "storecustomer";
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRoleKey(role);

  switch (normalizedRole) {
    case "superadmin":
      return "سوبر أدمن";
    case "owner":
    case "storeowner":
      return "صاحب متجر";
    case "customer":
      return "زبون";
    case "storecustomer":
      return "عميل متجر";
    case "guest":
      return "ضيف";
    default:
      return role ? String(role) : "غير محدد";
  }
}

export function getLandingPath(role) {
  if (isSuperAdminRole(role)) return "/dashboard";
  if (isOwnerRole(role)) return "/owner";
  return "/market";
}
