import { api } from '../lib/api';
import type { AuthUser } from '../lib/api';

export interface ErrorResponse {
  status: 'error';
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface CheckEmailSuccess {
  status: 'success';
  exists: boolean;
  hasPassword: boolean;
  email: string;
}

export interface CreatePasswordSuccess {
  status: 'success';
  userId: string;
  email: string;
  message: string;
}

export interface LoginSuccess {
  status: 'success';
  token: string;
  user: AuthUser;
  expiresIn?: string;
}

export interface ForgotPasswordSuccess {
  status: 'success';
  message: string;
  emailSent?: boolean;
}

export interface ResetPasswordSuccess {
  status: 'success';
  message: string;
}

export interface RegisterEmailSuccess {
  status: 'success';
  userId: string;
  email: string;
  message: string;
  emailSent: boolean;
}

export const authService = {
  async checkEmail(email: string): Promise<CheckEmailSuccess | ErrorResponse> {
    return api.post<{ email: string }, CheckEmailSuccess | ErrorResponse>('/auth/check-email', { email });
  },

  async login(email: string, password: string): Promise<LoginSuccess | ErrorResponse> {
    return api.post<{ email: string; password: string }, LoginSuccess | ErrorResponse>('/auth/login', { email, password });
  },

  async createPassword(token: string, password: string): Promise<CreatePasswordSuccess | ErrorResponse> {
    return api.post<{ token: string; password: string }, CreatePasswordSuccess | ErrorResponse>('/auth/create-password', { token, password });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordSuccess | ErrorResponse> {
    return api.post<{ email: string }, ForgotPasswordSuccess | ErrorResponse>('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordSuccess | ErrorResponse> {
    return api.post<{ token: string; newPassword: string }, ResetPasswordSuccess | ErrorResponse>('/auth/reset-password', { token, newPassword });
  },

  async registerEmail(email: string, adminToken: string): Promise<RegisterEmailSuccess | ErrorResponse> {
    return api.post<{ email: string }, RegisterEmailSuccess | ErrorResponse>('/auth/register-email', { email }, { headers: { Authorization: `Bearer ${adminToken}` } });
  }
};

