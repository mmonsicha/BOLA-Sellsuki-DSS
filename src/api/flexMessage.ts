import { api } from "./client";

export interface FlexMessageVariable {
  name: string;
  description: string;
  required: boolean;
}

export interface FlexMessage {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  content: string; // raw LINE Flex Message container JSON string
  variables: FlexMessageVariable[];
  created_at: string;
  updated_at: string;
}

export const flexMessageApi = {
  list: (params: { workspace_id: string; page?: number; page_size?: number }) =>
    api.get<{ data: FlexMessage[] }>("/v1/flex-messages", params),

  get: (id: string) =>
    api.get<{ data: FlexMessage }>(`/v1/flex-messages/${id}`),

  create: (body: {
    workspace_id: string;
    name: string;
    description?: string;
    content: string;
    variables?: FlexMessageVariable[];
  }) => api.post<{ data: FlexMessage }>("/v1/flex-messages", body),

  update: (
    id: string,
    body: Partial<{ name: string; description: string; content: string; variables: FlexMessageVariable[] }>
  ) => api.put<{ data: FlexMessage }>(`/v1/flex-messages/${id}`, body),

  delete: (id: string) => api.delete<void>(`/v1/flex-messages/${id}`),
};
