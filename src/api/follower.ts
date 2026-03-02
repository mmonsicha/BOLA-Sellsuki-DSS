import { api } from "./client";
import type { Follower, PaginatedResponse } from "@/types";

export interface ListFollowersParams {
  workspace_id: string;
  line_oa_id?: string;
  page?: number;
  page_size?: number;
}

export interface UpdateFollowerBody {
  display_name?: string;
  tags?: string[];
  note?: string;
  custom_fields?: Record<string, string>;
}

export const followerApi = {
  list: (params: ListFollowersParams) =>
    api.get<PaginatedResponse<Follower>>("/v1/followers", params),

  get: (id: string) =>
    api.get<Follower>(`/v1/followers/${id}`),

  update: (id: string, body: UpdateFollowerBody) =>
    api.put<Follower>(`/v1/followers/${id}`, body),
};
