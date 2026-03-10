import { api } from "./client";
import type { LONSubscriber, LONSubscriberStats, LONDeliveryLog } from "@/types";

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

export const lonApi = {
  listSubscribers: (params: ListLONSubscribersParams) =>
    api.get<ListLONSubscribersResponse>("/v1/lon-subscribers", params),

  getSubscriberStats: (lineOAId: string) =>
    api.get<LONSubscriberStats>("/v1/lon-subscribers/stats", { line_oa_id: lineOAId }),

  getSubscriber: (id: string) =>
    api.get<LONSubscriber>(`/v1/lon-subscribers/${id}`),

  revokeSubscriber: (id: string) =>
    api.delete<void>(`/v1/lon-subscribers/${id}`),

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
};
