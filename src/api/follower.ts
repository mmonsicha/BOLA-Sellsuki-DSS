import { api } from "./client";
import type { Follower, PaginatedResponse, UnifiedContact, ImportPhoneContactsPreview, PhoneContactDetail } from "@/types";

export interface ImportContactItem {
  phone: string;
  first_name?: string;
  last_name?: string;
  line_uid?: string;
}

export interface ListFollowersParams {
  workspace_id: string;
  line_oa_id?: string;
  search?: string;        // LIKE on display_name, phone, email
  follow_status?: string; // "following" | "unfollowed" | "blocked"
  tag?: string;           // exact tag name match
  page?: number;
  page_size?: number;
}

export interface UpdateFollowerBody {
  display_name?: string;
  tags?: string[];
  note?: string;
  custom_fields?: Record<string, string>;
}

export interface FollowerSyncStatus {
  status: "idle" | "fetching_ids" | "syncing_profiles" | "completed" | "failed";
  total_ids: number;
  synced_count: number;
  new_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface BroadcastDeliveryLogItem {
  id: string;
  broadcast_id: string;
  status: "pending" | "success" | "failed";
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface FollowerActivity {
  recent_broadcasts: BroadcastDeliveryLogItem[];
  total_broadcasts: number;
  lon_count: number;
  pnp_total: number;
  pnp_success: number;
}

export interface PhoneContactActivity {
  recent_broadcasts: BroadcastDeliveryLogItem[];
  total_broadcasts: number;
  lon_count: number;
  pnp_total: number;
  pnp_success: number;
}

export const followerApi = {
  list: (params: ListFollowersParams) =>
    api.get<PaginatedResponse<Follower>>("/v1/followers", params),

  get: (id: string, params?: { line_oa_id?: string }) =>
    api.get<Follower>(`/v1/followers/${id}`, params),

  update: (id: string, body: UpdateFollowerBody) =>
    api.put<Follower>(`/v1/followers/${id}`, body),

  startSync: (lineOAId: string) =>
    api.post<FollowerSyncStatus>(`/v1/followers/sync?line_oa_id=${lineOAId}`, {}),

  getSyncStatus: (lineOAId: string) =>
    api.get<FollowerSyncStatus>(`/v1/followers/sync/status`, { line_oa_id: lineOAId }),

  listUnified: (params: ListFollowersParams & { contact_status?: string }) =>
    api.get<PaginatedResponse<UnifiedContact>>("/v1/contacts", params),

  previewImportPhones: (lineOaId: string, contacts: ImportContactItem[]) =>
    api.post<ImportPhoneContactsPreview>(`/v1/contacts/import-phones/preview?line_oa_id=${lineOaId}`, { contacts }),

  importPhones: (lineOaId: string, contacts: ImportContactItem[]) =>
    api.post<{ imported: number }>(`/v1/contacts/import-phones?line_oa_id=${lineOaId}`, { contacts }),

  getPhoneContact: (id: string) =>
    api.get<PhoneContactDetail>(`/v1/contacts/phone/${id}`),

  updatePhoneContactProfile: (id: string, data: { email: string; note: string; tags: string[]; custom_fields: Record<string, string> }) =>
    api.put<PhoneContactDetail>(`/v1/contacts/phone/${id}/profile`, data),

  updatePhoneContact: (id: string, data: { first_name: string; last_name: string; phone: string }) =>
    api.put<PhoneContactDetail>(`/v1/contacts/phone/${id}`, data),

  deletePhoneContact: (id: string) =>
    api.delete<void>(`/v1/contacts/phone/${id}`),

  unlinkPhoneContactFollower: (phoneContactId: string, lineOAId: string) =>
    api.delete<void>(`/v1/contacts/phone/${phoneContactId}/oas/${lineOAId}`),

  bulkDeletePhoneContacts: (ids: string[]) =>
    api.delete<{ deleted: number }>(`/v1/contacts/phones`, { ids }),

  deleteAllPhoneContacts: () =>
    api.delete<{ deleted: number }>(`/v1/contacts/phones/all`),

  getFollowerActivity: (id: string) =>
    api.get<FollowerActivity>(`/v1/followers/${id}/activity`),

  getPhoneContactActivity: (id: string) =>
    api.get<PhoneContactActivity>(`/v1/contacts/phone/${id}/activity`),
};
