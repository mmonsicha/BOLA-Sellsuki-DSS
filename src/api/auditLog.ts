import { api } from "./client";
import { getWorkspaceId } from "@/lib/auth";

export interface AuditLog {
  id: string;
  workspace_id: string;
  admin_id: string;
  admin_email: string;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  page_size: number;
}

export interface ListAuditLogsParams {
  page?: number;
  page_size?: number;
  admin_id?: string;
  action?: string;
  from?: string;
  to?: string;
}

export const auditLogApi = {
  list: (params: ListAuditLogsParams = {}): Promise<AuditLogsResponse> => {
    const workspaceId = getWorkspaceId() ?? "";
    const queryParams: Record<string, string | number | boolean> = {};
    if (params.page) queryParams.page = params.page;
    if (params.page_size) queryParams.page_size = params.page_size;
    if (params.admin_id) queryParams.admin_id = params.admin_id;
    if (params.action) queryParams.action = params.action;
    if (params.from) queryParams.from = params.from;
    if (params.to) queryParams.to = params.to;
    return api.get<AuditLogsResponse>(`/v1/workspaces/${workspaceId}/audit-logs`, queryParams);
  },
};
