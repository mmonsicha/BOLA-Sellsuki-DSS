import { api } from "./client";
import type { LONJob, LONJobRun } from "@/types";
import { getWorkspaceId } from "@/lib/auth";

export interface ListLONJobsParams {
  line_oa_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface ListLONJobsResponse {
  data: LONJob[];
  total: number;
}

export interface ListLONJobRunsResponse {
  data: LONJobRun[];
  total: number;
}

export interface CreateLONJobRequest {
  line_oa_id: string;
  name: string;
  description?: string;
  schedule_type: "weekly" | "monthly";
  schedule_weekdays: number[];      // multiple days
  schedule_days_of_month: number[]; // multiple days
  schedule_hour: number;
  schedule_minute: number;
  timezone?: string;
  target_type: "all_contacts" | "segment";
  target_segment_id?: string;
  template_id: string;
  template_variables?: Record<string, string>;
}

export interface UpdateLONJobRequest {
  name?: string;
  description?: string;
  schedule_type?: "weekly" | "monthly";
  schedule_weekdays?: number[];
  schedule_days_of_month?: number[];
  schedule_hour?: number;
  schedule_minute?: number;
  timezone?: string;
  target_type?: "all_contacts" | "segment";
  target_segment_id?: string;
  template_id?: string;
  template_variables?: Record<string, string>;
}

export const lonJobApi = {
  list: (params?: ListLONJobsParams) => {
    const workspaceId = getWorkspaceId() ?? "";
    return api.get<ListLONJobsResponse>("/v1/lon-jobs", {
      workspace_id: workspaceId,
      ...params,
    });
  },

  get: (id: string) => api.get<LONJob>(`/v1/lon-jobs/${id}`),

  create: (body: CreateLONJobRequest) =>
    api.post<LONJob>("/v1/lon-jobs", body),

  update: (id: string, body: UpdateLONJobRequest) =>
    api.put<LONJob>(`/v1/lon-jobs/${id}`, body),

  delete: (id: string) => api.delete<void>(`/v1/lon-jobs/${id}`),

  pause: (id: string) => api.post<LONJob>(`/v1/lon-jobs/${id}/pause`, {}),

  resume: (id: string) => api.post<LONJob>(`/v1/lon-jobs/${id}/resume`, {}),

  trigger: (id: string) =>
    api.post<{ status: string }>(`/v1/lon-jobs/${id}/trigger`, {}),

  runs: (id: string, params?: { page?: number; page_size?: number }) =>
    api.get<ListLONJobRunsResponse>(`/v1/lon-jobs/${id}/runs`, params),
};
