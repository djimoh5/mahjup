import { BaseService } from './base.service';
import type { GameRecord } from '../../model/game.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export class GameService extends BaseService {
  async getAll(): Promise<{ records: GameRecord[]; error?: string }> {
    try {
      const res = await this.get<ApiResponse<GameRecord[]>>('/game/records');
      if (res.success && res.data) return { records: res.data };
      return { records: [], error: res.msg ?? 'Failed to load records' };
    } catch {
      return { records: [], error: 'Unable to connect to the server' };
    }
  }

  async save(record: GameRecord): Promise<{ record: GameRecord | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<GameRecord>>('/game/record', record);
      if (res.success && res.data) return { record: res.data };
      return { record: null, error: res.msg ?? 'Failed to save record' };
    } catch {
      return { record: null, error: 'Unable to connect to the server' };
    }
  }

  async remove(oid: string): Promise<{ error?: string }> {
    try {
      const res = await this.delete<ApiResponse<null>>(`/game/record/${oid}`);
      if (res.success) return {};
      return { error: res.msg ?? 'Failed to delete record' };
    } catch {
      return { error: 'Unable to connect to the server' };
    }
  }
}

export const gameService = new GameService();
