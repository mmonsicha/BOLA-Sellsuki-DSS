import { api } from "./client";
import type { WebhookSetting, WebhookType, WebhookVariable, TestWebhookResponse } from "@/types";

export interface ListWebhookSettingsParams {
  workspace_id: string;
  line_oa_id?: string;
}

export interface CreateWebhookSettingBody {
  workspace_id: string;
  line_oa_id?: string;
  webhook_type?: WebhookType;
  name: string;
  webhook_event?: string;
  description?: string;
  category?: string;
  variables?: WebhookVariable[];
  default_values?: Record<string, unknown>;
  security_token?: string;
  allowed_ips?: string[];
  http_status_code?: number;
  response_msg?: string;
  // Legacy
  target_url?: string;
  secret?: string;
}

export const webhookSettingApi = {
  list: (params: ListWebhookSettingsParams) =>
    api.get<{ data: WebhookSetting[] }>("/v1/webhook-settings", params),

  get: (id: string) =>
    api.get<WebhookSetting>(`/v1/webhook-settings/${id}`),

  create: (body: CreateWebhookSettingBody) =>
    api.post<WebhookSetting>("/v1/webhook-settings", body),

  update: (id: string, body: Partial<CreateWebhookSettingBody>) =>
    api.put<WebhookSetting>(`/v1/webhook-settings/${id}`, body),

  // FR-HOOK-13: Toggle active/inactive
  toggle: (id: string) =>
    api.patch<WebhookSetting>(`/v1/webhook-settings/${id}/toggle`, {}),

  delete: (id: string) =>
    api.delete<void>(`/v1/webhook-settings/${id}`),

  // Test webhook with dry run (no side effects)
  test: (id: string, eventType: string = "follow") =>
    api.post<TestWebhookResponse>(`/v1/webhook-settings/${id}/test`, { event_type: eventType }),

  // Regenerate security token (old token becomes invalid)
  regenerateToken: (id: string) =>
    api.post<WebhookSetting>(`/v1/webhook-settings/${id}/regenerate-token`, {}),
};
