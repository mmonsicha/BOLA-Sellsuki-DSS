import { api } from "./client";

export interface RGBTokenPreviewResponse {
  masked_phone: string;
}

export interface RGBIdentityConfirmParams {
  line_oa_id: string;
  encrypted_token: string;
  line_user_id: string;
}

export interface RGBIdentityConfirmResponse {
  status: string;
}

export const rgbApi = {
  getTokenPreview: (params: { t: string; line_oa_id: string }) =>
    api.get<RGBTokenPreviewResponse>("/public/lon/rgb-token-preview", params),

  confirmIdentity: (params: RGBIdentityConfirmParams) =>
    api.post<RGBIdentityConfirmResponse>("/public/lon/rgb-identity-confirm", params),
};
