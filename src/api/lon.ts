import { api } from "./client";
import type { LONSubscriber, LONSubscriberStats, LONDeliveryLog, PNPDeliveryLog, PNPTemplate } from "@/types";

export interface ListLONSubscribersParams {
  line_oa_id: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface ListLONSubscribersResponse {
  data: LONSubscriber[];
  total: number;
}

export interface SubscribeByPhoneParams {
  line_oa_id: string;
  phone_number: string;
  source_form_id?: string;
}

export interface ListLONDeliveryLogsParams {
  line_oa_id: string;
  page?: number;
  page_size?: number;
}

export interface ListLONDeliveryLogsResponse {
  data: LONDeliveryLog[];
}

export interface BulkSubscribeItem {
  phone_number: string;
  source_form_id?: string;
}

export interface BulkSubscribeByPhoneParams {
  line_oa_id: string;
  items: BulkSubscribeItem[];
}

export interface BulkSubscribeByPhoneFailure {
  phone_number: string;
  error: string;
}

export interface BulkSubscribeByPhoneResult {
  succeeded: LONSubscriber[];
  failed: BulkSubscribeByPhoneFailure[];
}

export interface LONPublicOAInfo {
  name: string;
  basic_id: string;
  picture_url: string;
}

export interface LIFFConsentParams {
  line_oa_id: string;
  line_user_id: string;
  notification_token: string;
}

export interface SendConsentRequestParams {
  line_oa_id: string;
  follower_line_user_ids?: string[];
  custom_message?: string;
}

export interface SendConsentRequestResult {
  sent: number;
  failed: number;
}

export interface SendLONByPhoneParams {
  line_oa_id: string;
  phone_number: string;
  triggered_by?: string;
  // Template mode (preferred)
  template_id?: string;
  template_variables?: Record<string, string>;
  // Legacy mode
  template_key?: string;
  body?: Record<string, unknown>;
}

export interface BulkSendLONByPhoneParams {
  line_oa_id: string;
  phone_numbers: string[];
  template_id?: string;
  template_variables?: Record<string, string>;
  triggered_by?: string;
}

export interface ListPNPLogsParams {
  line_oa_id: string;
  page?: number;
  page_size?: number;
}

export interface ListPNPLogsResponse {
  data: PNPDeliveryLog[];
}

export const lonApi = {
  listSubscribers: (params: ListLONSubscribersParams) =>
    api.get<ListLONSubscribersResponse>("/v1/lon-subscribers", params),

  getSubscriberStats: (lineOAId: string) =>
    api.get<LONSubscriberStats>("/v1/lon-subscribers/stats", { line_oa_id: lineOAId }),

  getSubscriber: (id: string) =>
    api.get<LONSubscriber>(`/v1/lon-subscribers/${id}`),

  revokeSubscriber: (id: string) =>
    api.delete<void>(`/v1/lon-subscribers/${id}`),

  recordSubscriberAccess: (id: string) =>
    api.post<void>(`/v1/lon-subscribers/${id}/access-log`, {}),

  listDeliveryLogs: (params: ListLONDeliveryLogsParams) =>
    api.get<ListLONDeliveryLogsResponse>("/v1/lon-delivery-logs", params),

  subscribeByPhone: (params: SubscribeByPhoneParams) =>
    api.post<LONSubscriber>("/v1/lon/subscribe-by-phone", params),

  bulkSubscribeByPhone: (params: BulkSubscribeByPhoneParams) =>
    api.post<BulkSubscribeByPhoneResult>("/v1/lon/bulk-subscribe-by-phone", params),

  getPublicOAInfo: (lineOAId: string) =>
    api.get<LONPublicOAInfo>("/v1/public/lon/oa-info", { line_oa_id: lineOAId }),

  liffConsent: (params: LIFFConsentParams) =>
    api.post<{ id: string }>("/v1/public/lon/liff-consent", params),

  sendConsentRequest: (params: SendConsentRequestParams) =>
    api.post<SendConsentRequestResult>("/v1/lon/send-consent-request", params),

  sendLONByPhone: (params: SendLONByPhoneParams) =>
    api.post<PNPDeliveryLog>("/v1/pnp/send", params),

  listLONByPhoneLogs: (params: ListPNPLogsParams) =>
    api.get<ListPNPLogsResponse>("/v1/pnp/logs", params),

  bulkSendLONByPhone: (body: BulkSendLONByPhoneParams) =>
    api.post<import("@/types").BulkSendLONByPhoneResponse>("/v1/pnp/bulk-send", body),
};

export const pnpTemplateApi = {
  list: (params: { line_oa_id?: string }) =>
    api.get<{ data: PNPTemplate[] }>("/v1/pnp-templates", params),
  get: (id: string) =>
    api.get<PNPTemplate>(`/v1/pnp-templates/${id}`),
  saveAs: (body: { line_oa_id: string; name: string; description?: string; source_id?: string }) =>
    api.post<PNPTemplate>("/v1/pnp-templates", body),
  update: (id: string, body: {
    name?: string;
    description?: string;
    json_body?: Record<string, unknown>;
    editable_schema?: Array<{ path: string; type: string; label: string; max_len?: number }>;
  }) =>
    api.put<PNPTemplate>(`/v1/pnp-templates/${id}`, body),
  delete: (id: string) =>
    api.delete<void>(`/v1/pnp-templates/${id}`),
};
