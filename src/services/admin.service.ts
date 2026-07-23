import { BaseService } from './base.service';
import type { UserSummary } from '../../model/user.model';
import type { MahjSession } from '../../model/mahj-session.model';
import type { GameRecord } from '../../model/game.model';
import type { GameAnalysis } from '../../model/game-analysis.model';
import type { Invite } from '../../model/invite.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export interface AdminData {
  users: UserSummary[];
  sessions: MahjSession[];
  records: GameRecord[];
  analyses: GameAnalysis[];
  invites: Invite[];
}

export class AdminService extends BaseService {
  protected get tokenKey(): string {
    return 'mahjupAdminToken';
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await this.post<ApiResponse<null>>('/admin/login', { email, password });
      if (res.success) return { success: true };
      return { success: false, error: res.msg ?? 'Login failed' };
    } catch {
      return { success: false, error: 'Unable to connect, please try again' };
    }
  }

  async getData(): Promise<{ data: AdminData | null; error?: string }> {
    try {
      const res = await this.get<ApiResponse<AdminData>>('/admin/data');
      if (res.success && res.data) return { data: res.data };
      return { data: null, error: res.msg ?? 'Failed to load data' };
    } catch {
      return { data: null, error: 'Unable to connect, please try again' };
    }
  }

  logout(): void {
    this.clearToken();
  }
}

export const adminService = new AdminService();
