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
    //this.setToken('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIwOTc1MjA1ODksImRhdGEiOiJhOGM4NDViYWRmYTA3ZWY3MTgzNjk2ZTYyNzQ2MDA4NzpiZThhNzQ5MTFiZWJlNDE0ZjVkNTk3ZDEzZmM2NDQzMTg0NmZiYmI1ZDhjYTU1ZTIyNDg2M2RiNzI2ZjY5YmM3OTc1MjUzMDViYjNiYjZlODczNzliMDU1N2NiMDg1MjQ1N2JjMWQzZWE3ZmU4YjdmOGU5MTUzOWU0ZTg1MzE5ODMyZTg3ZDJkNjAwNGQwYjQxOWQ1YzVkODA3YWQxZGFiM2M3YTAyNzYxYzNiODc5NTI3NmVmNzQ3YzYzMTk0N2EwYTg3NGIzOWRiOTBkN2FiM2U5NzFlOTlkYTM5NTFlMGYzNjdmYzAxMjk2ODZmZTEwZGM2Mzk1NGQ5MjdhZGE1ZmE0ZDFkM2M4NDc0NDFlMDMxYTgwN2UxYjJmZmMyNGFjMzdiNTBhM2I3YWJkZTg2YTNiMTgxZGUyOTJmMmNiZmZjZDVhZmY0YjI0M2Y2MzAyMTkwNzBkMGRiNzNiNjQ0Y2M0YTI1YTliOWU0NTg4ZDlmYTkyNjgzODBiODFiMzkxZTVjNjE2YjQ5MTRlMDI3NjgyMGIzMTk3NDI3NDkyODkzMjA3ZDRlYzRiMTQ5Mzg5MzVhYjVmYTdlNTFkMWQxYzAzMzg1ZmE4NWVmZGVlMWI4OWIwMzU4OWRlZGY2MjA5NmFhMGZhZTMwM2E1OGE0YjU2MmQyOGRlYWVhNjYzOTMwMWZkOTQ2ZWJjMjI1MGUxOTdlZTQ0M2FjMjUwMzcxNzQ4YjQyMWU5YjYxY2QzM2VhNDI2MWQ0MTY2N2RlMzc5MDVkNGVkZTI5NzA4YmNiMDAwZGRjZTYyM2E1YjkzYzFhM2EwNmZiOTBiYTM3NzFiZTU3NjBjOTFmNjgwN2Y0MGZiOGM2MjA2MjljMDY4Mzc3MmU0MzkzZTBjM2M3MjNkZjYxYWQwNjI3Njc2Y2VlYmEyOTMyZTMxMmY0YjM1ODc0YTBkNTE5YzJmNDQ0OTBmODZiMzZlMGE4ZGYzYmI4ZjYzNDcyMGE1ZDk4OTVkOTU0YzJhMzYzZTkwZDkzZTk2ODUzMjA1ODhiMGUzYWE1ZTkxOWVkYjVhMmU3YTgyYWE4OTAzMDVjMTQiLCJpYXQiOjE3ODIxNTk2ODl9.aAj5qAz2xffNlotxQflYAf6Atzx_xfQ1SaoePLivChGZelKxkLfVnS3hb-iLGS2_DwJHqxEYe6oAMP5U7xlUmUTme8j5ruHXJQHaVkwTWUrmJrEt6PnhmybL2fZpYvU9sYmYcXjRNCHFCJJjEhrMxxhPdq_LeEaJtZw3KTfMj5CNqtxJ8OewcH73u6tESc3MP2RICgdlU0nzuX7ulxCkgUGxlgVllsCc6hMGNaFcqTsr8eFh4804ItWtIr7lfACTwUyZkQBzX5igcPiBlPDyzdFQzaCfbGFAcr1prbT7jd4DhoHnYoNhkdP9UMUushzBkih2HytaJgjUfj9HsWr3SA');
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
    //this.clearToken();
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
      return { user: null, error: 'Unable to connect, please try again' };
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
      return { user: null, error: 'Unable to connect, please try again' };
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
      return { user: null, error: 'Unable to connect, please try again' };
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
      return { user: null, error: 'Unable to connect, please try again' };
    }
  }

  async invite(email: string, sessionless = false): Promise<{ oid: string | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<{ oid: string }>>('/auth/invite', { username: email, sessionless });
      if (res.success && res.data) return { oid: res.data.oid };
      return { oid: null, error: res.msg ?? 'Invite failed' };
    } catch {
      return { oid: null, error: 'Unable to connect, please try again' };
    }
  }

  async requestLoginCode(username: string): Promise<{ error?: string }> {
    try {
      await this.post<ApiResponse<null>>('/auth/code/request', { username });
      return {};
    } catch {
      return { error: 'Unable to connect, please try again' };
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
      return { user: null, error: 'Unable to connect, please try again' };
    }
  }

  async requestPasswordReset(username: string): Promise<{ error?: string }> {
    try {
      await this.post<ApiResponse<null>>('/auth/password/reset', { username });
      return {};
    } catch {
      return { error: 'Unable to connect, please try again' };
    }
  }

  async confirmPasswordReset(username: string, code: string, newPassword: string): Promise<{ error?: string }> {
    try {
      const res = await this.post<ApiResponse<null>>('/auth/password/reset/confirm', { username, code, newPassword });
      if (res.success) return {};
      return { error: res.msg ?? 'Reset failed' };
    } catch {
      return { error: 'Unable to connect, please try again' };
    }
  }

  logout(): void {
    this.clearToken();
  }
}

export const authService = new AuthService();
