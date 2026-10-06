export type AdminRole = "super_admin" | "product_manager" | "order_manager" | "support_admin";

export const PERMISSIONS = [
  "dashboard:view",
  "products:read", "products:write",
  "categories:write",
  "inventory:write",
  "orders:read", "orders:write",
  "customers:read", "customers:manage",
  "payments:read", "payments:refund",
  "discounts:write",
  "reviews:moderate",
  "content:write",
  "notifications:send",
  "reports:view",
  "admins:manage",
  "settings:manage",
  "audit:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  product_manager: [
    "dashboard:view", "products:read", "products:write", "categories:write",
    "inventory:write", "reviews:moderate", "content:write", "reports:view",
  ],
  order_manager: [
    "dashboard:view", "orders:read", "orders:write", "customers:read",
    "payments:read", "inventory:write", "reports:view",
  ],
  support_admin: [
    "dashboard:view", "orders:read", "customers:read", "customers:manage", "reviews:moderate", "notifications:send",
  ],
};

export const can = (role: AdminRole, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role].includes(permission);
