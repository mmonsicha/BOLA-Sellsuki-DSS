import { api } from "./client";
import type { Workspace, OutboundWebhookConfig } from "@/types";

export const workspaceApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get<{ data: Workspace[] }>("/v1/workspaces", params),

  get: (id: string) =>
    api.get<Workspace>(`/v1/workspaces/${id}`),

  getBySlug: (slug: string) =>
    api.get<Workspace>(`/v1/workspaces/slug/${slug}`),

  create: (body: { name: string; slug: string; logo_url?: string; plan_id?: string }) =>
    api.post<Workspace>("/v1/workspaces", body),

  update: (id: string, body: Partial<{ name: string; logo_url: string; plan_id: string; is_active: boolean }>) =>
    api.put<Workspace>(`/v1/workspaces/${id}`, body),

  getOutboundWebhook: (id: string) =>
    api.get<OutboundWebhookConfig>(`/v1/workspaces/${id}/outbound-webhook`),

  updateOutboundWebhook: (id: string, body: { webhook_url: string; secret?: string }) =>
    api.put<OutboundWebhookConfig>(`/v1/workspaces/${id}/outbound-webhook`, body),
};
