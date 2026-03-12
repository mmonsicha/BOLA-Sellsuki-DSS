import { api } from "./client";

export interface WorkspaceEntry {
  id: string;
  name: string;
  token: string;
  expires_at: string;
}

export interface GlobalLoginResponse {
  workspaces: WorkspaceEntry[];
}

export interface LoginResponse {
  token: string;
  expires_at: string;
}

export const authApi = {
  /** Global login — finds all workspaces matching these credentials. */
  globalLogin: (email: string, password: string) =>
    api.post<GlobalLoginResponse>("/v1/auth/login", { email, password }),

  /** Workspace-scoped login (legacy / direct workspace login). */
  login: (workspaceId: string, email: string, password: string) =>
    api.post<LoginResponse>(`/v1/workspaces/${workspaceId}/auth/login`, { email, password }),

  /** Pending admin sets their first password and gets a JWT back. */
  acceptInvite: (workspaceId: string, email: string, password: string) =>
    api.post<LoginResponse>(`/v1/workspaces/${workspaceId}/auth/accept-invite`, { email, password }),

  /** Super-admin resets another admin's password. */
  resetAdminPassword: (workspaceId: string, adminId: string, newPassword: string) =>
    api.post<void>(`/v1/workspaces/${workspaceId}/admins/${adminId}/reset-password`, { new_password: newPassword }),

  /** Admin invites */
  listAdmins: (workspaceId: string) =>
    api.get<{ data: AdminResponse[] }>(`/v1/workspaces/${workspaceId}/admins`),
};

export interface AdminResponse {
  id: string;
  workspace_id: string;
  email: string;
  name: string;
  avatar_url: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}
