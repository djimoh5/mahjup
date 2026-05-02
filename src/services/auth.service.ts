import { BaseService } from './base.service';

export interface AuthedUser {
  oid: string;
  username: string;
  token: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export class AuthService extends BaseService {
  async checkAuth(): Promise<AuthedUser | null> {
    if (!this.getToken()) return null;
    try {
      const res = await this.post<ApiResponse<AuthedUser>>('/auth');
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

  async login(username: string, password: string): Promise<{ user: AuthedUser | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<AuthedUser>>('/auth', { username, password });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Login failed' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  async register(username: string, password: string): Promise<{ user: AuthedUser | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<AuthedUser>>('/auth/create', { username, password });
      if (res.success && res.data) {
        if (res.data.token) this.setToken(res.data.token);
        return { user: res.data };
      }
      return { user: null, error: res.msg ?? 'Registration failed' };
    } catch {
      return { user: null, error: 'Unable to connect to the server' };
    }
  }

  logout(): void {
    this.clearToken();
  }
}

export const authService = new AuthService();
