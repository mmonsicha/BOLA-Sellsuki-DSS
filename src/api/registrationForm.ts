import { api } from "./client";
import type { RegistrationForm, FormField, FormSubmission } from "@/types";

export interface ListRegistrationFormsResponse {
  data: RegistrationForm[];
  total: number;
}

export interface ListSubmissionsResponse {
  data: FormSubmission[];
  total: number;
}

export interface CreateRegistrationFormBody {
  workspace_id: string;
  line_oa_id: string;
  name: string;
  title?: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  liff_id?: string;
  liff_url?: string;
  success_message?: string;
  redirect_url?: string;
  fields?: FormField[];
  terms_text?: string;
}

export interface UpdateRegistrationFormBody {
  name?: string;
  title?: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  liff_id?: string;
  liff_url?: string;
  success_message?: string;
  redirect_url?: string;
  fields?: FormField[];
  terms_text?: string;
}

export const registrationFormApi = {
  list: (lineOAId: string, page = 1, pageSize = 20) =>
    api.get<ListRegistrationFormsResponse>("/v1/registration-forms", {
      line_oa_id: lineOAId,
      page,
      page_size: pageSize,
    }),

  create: (data: CreateRegistrationFormBody) =>
    api.post<RegistrationForm>("/v1/registration-forms", data),

  get: (id: string) =>
    api.get<RegistrationForm>(`/v1/registration-forms/${id}`),

  update: (id: string, data: UpdateRegistrationFormBody) =>
    api.put<RegistrationForm>(`/v1/registration-forms/${id}`, data),

  delete: (id: string) =>
    api.delete<void>(`/v1/registration-forms/${id}`),

  toggle: (id: string) =>
    api.post<RegistrationForm>(`/v1/registration-forms/${id}/toggle`, {}),

  listSubmissions: (id: string, page = 1, pageSize = 20) =>
    api.get<ListSubmissionsResponse>(`/v1/registration-forms/${id}/submissions`, {
      page,
      page_size: pageSize,
    }),
};
