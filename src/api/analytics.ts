import { api } from "./client";
import type {
  AnalyticsSummary,
  AnalyticsEvent,
  FollowerBehaviorSummary,
  AnalyticsEventConfig,
} from "@/types";

export interface ListAnalyticsEventsParams {
  workspace_id: string;
  line_oa_id?: string;
  event_type?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number;
}

export interface AnalyticsEventsResponse {
  data: AnalyticsEvent[];
  total: number;
  page: number;
}

export interface CreateEventConfigBody {
  workspace_id: string;
  line_oa_id: string;
  element_type: string;
  element_id: string;
  element_label: string;
  target_url: string;
}

export const analyticsApi = {
  getSummary: (params: {
    workspace_id: string;
    line_oa_id?: string;
    period?: string;
  }) =>
    api.get<AnalyticsSummary>("/v1/analytics/summary", params as Record<string, string>),

  listEvents: (params: ListAnalyticsEventsParams) =>
    api.get<AnalyticsEventsResponse>("/v1/analytics/events", params as Record<string, string | number>),

  getFollowerBehavior: (followerId: string, workspaceId: string) =>
    api.get<FollowerBehaviorSummary>(`/v1/analytics/followers/${followerId}/behavior`, {
      workspace_id: workspaceId,
    }),

  createEventConfig: (body: CreateEventConfigBody) =>
    api.post<AnalyticsEventConfig>("/v1/analytics/event-configs", body),
};
