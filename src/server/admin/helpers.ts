import type { NextRequest } from "next/server";
import type { AdminContext } from "../auth/guards";
import { getIp } from "../http";
import { audit } from "../security/audit";

export function paging(req: NextRequest, defaultSize = 20) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || defaultSize));
  return { page, pageSize, offset: (page - 1) * pageSize, sp };
}

export const logAdmin = (ctx: AdminContext, req: NextRequest, action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) =>
  audit({ actorType: "admin", actorId: ctx.admin.id, action, entityType, entityId, metadata, ip: getIp(req) });
