import { BaseService } from './base.service';
import type { MahjSession } from '../../model/mahj-session.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export class MahjSessionService extends BaseService {
  async getAll(): Promise<{ sessions: MahjSession[]; error?: string }> {
    try {
      const res = await this.get<ApiResponse<MahjSession[]>>('/mahj-session/list');
      if (res.success && res.data) return { sessions: res.data };
      return { sessions: [], error: res.msg ?? 'Failed to load sessions' };
    } catch {
      return { sessions: [], error: 'Unable to connect, please try again' };
    }
  }

  async save(session: MahjSession): Promise<{ session: MahjSession | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<MahjSession>>('/mahj-session', session);
      if (res.success && res.data) return { session: res.data };
      return { session: null, error: res.msg ?? 'Failed to save session' };
    } catch {
      return { session: null, error: 'Unable to connect, please try again' };
    }
  }

  async remove(oid: string): Promise<{ error?: string }> {
    try {
      const res = await this.delete<ApiResponse<null>>(`/mahj-session/${oid}`);
      if (res.success) return {};
      return { error: res.msg ?? 'Failed to delete session' };
    } catch {
      return { error: 'Unable to connect, please try again' };
    }
  }
}

export const mahjSessionService = new MahjSessionService();
