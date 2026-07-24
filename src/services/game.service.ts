import { BaseService } from './base.service';
import type { GameRecord, PlayerHand } from '../../model/game.model';
import { type GameAnalysis, type GameAnalysisFilters, normalizeGameAnalysis } from '../../model/game-analysis.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  msg?: string;
}

export class GameService extends BaseService {
  async getRecord(oid: string): Promise<{ record: GameRecord | null; error?: string }> {
    try {
      const res = await this.get<ApiResponse<GameRecord>>(`/game/record/${oid}`);
      if (res.success && res.data) return { record: res.data };
      return { record: null, error: res.msg ?? 'Failed to load record' };
    } catch {
      return { record: null, error: 'Unable to connect, please try again' };
    }
  }

  async getAll(): Promise<{ records: GameRecord[]; error?: string }> {
    try {
      const res = await this.get<ApiResponse<GameRecord[]>>('/game/records');
      if (res.success && res.data) return { records: res.data };
      return { records: [], error: res.msg ?? 'Failed to load records' };
    } catch {
      return { records: [], error: 'Unable to connect, please try again' };
    }
  }

  async save(record: GameRecord): Promise<{ record: GameRecord | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<GameRecord>>('/game/record', record);
      if (res.success && res.data) return { record: res.data };
      return { record: null, error: res.msg ?? 'Failed to save record' };
    } catch {
      return { record: null, error: 'Unable to connect, please try again' };
    }
  }

  async savePlayer(gameOid: string, idx: number, player: PlayerHand): Promise<{ error?: string }> {
    try {
      const res = await this.post<ApiResponse<null>>('/game/record/player', { oid: gameOid, idx, player });
      if (res.success) return {};
      return { error: res.msg ?? 'Failed to save player hand' };
    } catch {
      return { error: 'Unable to connect, please try again' };
    }
  }

  async remove(oid: string): Promise<{ error?: string }> {
    try {
      const res = await this.delete<ApiResponse<null>>(`/game/record/${oid}`);
      if (res.success) return {};
      return { error: res.msg ?? 'Failed to delete record' };
    } catch {
      return { error: 'Unable to connect, please try again' };
    }
  }

  async getSummary(filters: GameAnalysisFilters): Promise<{ analysis: GameAnalysis | null; error?: string }> {
    try {
      const res = await this.post<ApiResponse<GameAnalysis>>('/game/summary', { filters });
      if (res.success && res.data) return { analysis: normalizeGameAnalysis(res.data) };
      return { analysis: null, error: res.msg ?? 'Failed to generate summary' };
    } catch {
      return { analysis: null, error: 'Unable to connect, please try again' };
    }
  }

  async getAnalyses(): Promise<{ analyses: GameAnalysis[]; error?: string }> {
    try {
      const res = await this.get<ApiResponse<GameAnalysis[]>>('/game/analysis');
      // Backfills filters/filtersKey/gameIdsKey client-side for any legacy summary the
      // backend hasn't normalized yet (older deploy, or the DB migration hasn't run).
      if (res.success) return { analyses: (res.data ?? []).map(normalizeGameAnalysis) };
      return { analyses: [], error: res.msg ?? 'Failed to load analyses' };
    } catch {
      return { analyses: [], error: 'Unable to connect, please try again' };
    }
  }

  async deleteAnalysis(oid: string): Promise<{ error?: string }> {
    try {
      const res = await this.delete<ApiResponse<null>>(`/game/analysis/${oid}`);
      if (res.success) return {};
      return { error: res.msg ?? 'Failed to delete summary' };
    } catch {
      return { error: 'Unable to connect, please try again' };
    }
  }
}

export const gameService = new GameService();
