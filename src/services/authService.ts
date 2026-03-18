import { api } from '../lib/api';
import type { AuthUser } from '../lib/api';

// URLs de los backends
const AUTH_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const MCP_BASE_URL = import.meta.env.VITE_MCP_URL || 'https://mcp-promps.onrender.com';

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

export interface OAuthCallbackSuccess {
  status: 'success';
  redirectUrl: string; // URL HTTPS del backend que hace el redirect final a VS Code
}

export const authService = {
  async checkEmail(email: string): Promise<CheckEmailSuccess | ErrorResponse> {
    return api.post<{ email: string }, CheckEmailSuccess | ErrorResponse>('/auth/check-email', { email });
  },

  async login(email: string, password: string): Promise<LoginSuccess | ErrorResponse> {
    return api.post<{ email: string; password: string }, LoginSuccess | ErrorResponse>('/auth/login', { email, password });
  },

  async oauthCallback(oauthRequest: string, jwtToken: string): Promise<OAuthCallbackSuccess | ErrorResponse> {
    const MCP_OAUTH_CALLBACK = (import.meta.env.VITE_MCP_CALLBACK as string) || 'https://mcp-promps.onrender.com/oauth/callback';
    return api.post<{ oauth_request: string; jwt: string }, OAuthCallbackSuccess | ErrorResponse>(MCP_OAUTH_CALLBACK, { oauth_request: oauthRequest, jwt: jwtToken });
  },

  async createPassword(token: string, password: string): Promise<CreatePasswordSuccess | ErrorResponse> {
    return api.post<{ token: string; password: string }, CreatePasswordSuccess | ErrorResponse>('/auth/create-password', { token, password });
  },

  async verifyResetToken(token: string): Promise<{ status: 'success' } | ErrorResponse> {
    return api.post<{ token: string }, { status: 'success' } | ErrorResponse>('/auth/verify-reset-token', { token });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordSuccess | ErrorResponse> {
    return api.post<{ email: string }, ForgotPasswordSuccess | ErrorResponse>('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordSuccess | ErrorResponse> {
    return api.post<{ token: string; newPassword: string }, ResetPasswordSuccess | ErrorResponse>('/auth/reset-password', { token, newPassword });
  },

  async registerEmail(email: string, adminToken: string): Promise<RegisterEmailSuccess | ErrorResponse> {
    return api.post<{ email: string }, RegisterEmailSuccess | ErrorResponse>('/auth/register-email', { email }, { headers: { Authorization: `Bearer ${adminToken}` } });
  },

  /**
   * Logout del Backend de Login
   * Revoca el JWT del usuario registrando su jti en la blacklist
   * 
   * @param token - El JWT a revocar
   * @returns Promise con el resultado
   */
  async logout(token: string): Promise<{ status: 'success' } | { status: 'error'; message: string }> {
    try {
      console.log('🔐 Revocando JWT en Backend de Login...');
      
      const response = await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log('✅ JWT revocado en Backend de Login');
        return { status: 'success' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error revocando JWT:', errorData);
        return {
          status: 'error',
          message: errorData.message || 'Error al revocar token'
        };
      }
    } catch (error) {
      console.error('❌ Error de red revocando JWT:', error);
      return {
        status: 'error',
        message: 'Error de red al cerrar sesión'
      };
    }
  },

  /**
   * Revocar access_token de MCP Server
   * Esto invalidará el acceso de VSCode al MCP
   * 
   * @param mcpAccessToken - El access_token OAuth a revocar
   * @returns Promise con el resultado
   */
  async revokeMCPToken(mcpAccessToken: string): Promise<{ status: 'success' } | { status: 'error'; message: string }> {
    try {
      console.log('🔐 Revocando access_token en MCP Server...');
      
      const response = await fetch(`${MCP_BASE_URL}/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${mcpAccessToken}`
        },
        body: new URLSearchParams({
          token: mcpAccessToken,
          token_type_hint: 'access_token'
        })
      });
      
      if (response.ok) {
        console.log('✅ Access token de MCP revocado');
        return { status: 'success' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error revocando token de MCP:', errorData);
        return {
          status: 'error',
          message: errorData.message || 'Error al revocar token de MCP'
        };
      }
    } catch (error) {
      console.error('❌ Error de red revocando token de MCP:', error);
      return {
        status: 'error',
        message: 'Error de red al revocar token de MCP'
      };
    }
  },

  /**
   * Revocar refresh_token de MCP Server (si existe)
   * 
   * @param mcpRefreshToken - El refresh_token a revocar
   * @param mcpAccessToken - Access token para autenticación
   */
  async revokeMCPRefreshToken(
    mcpRefreshToken: string, 
    mcpAccessToken: string
  ): Promise<{ status: 'success' } | { status: 'error'; message: string }> {
    try {
      console.log('🔐 Revocando refresh_token en MCP Server...');
      
      const response = await fetch(`${MCP_BASE_URL}/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${mcpAccessToken}`
        },
        body: new URLSearchParams({
          token: mcpRefreshToken,
          token_type_hint: 'refresh_token'
        })
      });
      
      if (response.ok) {
        console.log('✅ Refresh token de MCP revocado');
        return { status: 'success' };
      } else {
        return {
          status: 'error',
          message: 'Error al revocar refresh token de MCP'
        };
      }
    } catch (error) {
      console.error('❌ Error revocando refresh token de MCP:', error);
      return {
        status: 'error',
        message: 'Error de red'
      };
    }
  }
};

