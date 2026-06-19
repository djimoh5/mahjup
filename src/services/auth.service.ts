import { BaseService } from './base.service';
import { UserAuth } from '../../model/auth.model';

export type AuthedUser = UserAuth;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export class AuthService extends BaseService {
  async checkAuth(): Promise<UserAuth | null> {
    if (!this.getToken()) return null;
    try {
      const res = await this.post<ApiResponse<UserAuth>>('/auth');
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return res.data;
      }
    } catch {
      // network error or expired token — treat as unauthenticated
    }
    this.clearToken();
    return null;
  }

  async login(username: string, password: string): Promise<{ user: UserAuth | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<UserAuth>>('/auth', { username, password });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Login failed' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  async register(username: string, password: string): Promise<{ user: UserAuth | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<UserAuth>>('/auth/create', { username, password });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Registration failed' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  async updateProfile(firstName: string, lastName: string): Promise<{ user: UserAuth | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<UserAuth>>('/user/profile', { firstName: firstName.trim(), lastName: lastName.trim() });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Update failed' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  async redeemInvite(code: string): Promise<{ user: AuthedUser | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<UserAuth>>('/auth/invite/redeem', { code });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Invalid or expired invite link' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  async invite(email: string, sessionless = false): Promise<{ oid: string | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<{ oid: string }>>('/auth/invite', { username: email, sessionless });
      if (res.success && res.data) return { oid: res.data.oid };
      return { oid: null, error: res.msg ?? 'Invite failed' };
    } catch {
      return { oid: null, error: 'Unable to connect to the server' };
    }
  }

  async requestLoginCode(username: string): Promise<{ error?: string }> {
    try {
      await this.post<ApiResponse<null>>('/auth/code/request', { username });
      return {};
    } catch {
      return { error: 'Unable to connect to the server' };
    }
  }

  async verifyLoginCode(username: string, code: string): Promise<{ user: UserAuth | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<UserAuth>>('/auth/code/verify', { username, code });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Invalid or expired code' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  async requestPasswordReset(username: string): Promise<{ error?: string }> {
    try {
      await this.post<ApiResponse<null>>('/auth/password/reset', { username });
      return {};
    } catch {
      return { error: 'Unable to connect to the server' };
    }
  }

  async confirmPasswordReset(username: string, code: string, newPassword: string): Promise<{ error?: string }> {
    try {
      const res = await this.post<ApiResponse<null>>('/auth/password/reset/confirm', { username, code, newPassword });
      if (res.success) return {};
      return { error: res.msg ?? 'Reset failed' };
    } catch {
      return { error: 'Unable to connect to the server' };
    }
  }

  logout(): void {
    this.clearToken();
  }
}

export const authService = new AuthService();
