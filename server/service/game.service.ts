import { Bootstrap, Injectable } from '../config/bootstrap';
import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';

import { MahjSessionRepository } from '../repository/mahj-session.repository';
import { GameRepository } from '../repository/game.repository';
import { GameRecord } from '../../model/game.model';

@Injectable()
@Bootstrap()
export class GameService extends BaseService {
    constructor(protected appService: AppService, private mahjSessionRepository: MahjSessionRepository, private gameRepository: GameRepository) {
        super(appService);
    }

    async getByUser(userId: string): Promise<ApiResponse<GameRecord[]>> {
        const sessions = await this.mahjSessionRepository.getByUser(userId);
        const recordsBySessions = await this.gameRepository.getBySessions(sessions.map(s => s.oid));
        const recordsByParticipation = await this.gameRepository.getByParticipant(userId);
        const existingOids = new Set(recordsBySessions.map(r => r.oid as string));
        const merged = [...(recordsBySessions ?? [])];
        for (const r of (recordsByParticipation ?? [])) {
            if (!existingOids.has(r.oid as string)) merged.push(r);
        }
        return new ApiResponse(true, merged);
    }

    async save(record: GameRecord, userId: string): Promise<ApiResponse<GameRecord>> {
        record.userId = userId;
        const saved = await this.gameRepository.save(record);
        return new ApiResponse(true, saved);
    }

    async remove(oid: string, userId: string): Promise<ApiResponse<null>> {
        const record = await this.gameRepository.getByOid(oid);
        if (!record) {
            return new ApiResponse(false, null, 'record not found');
        }
        if (record.userId !== userId) {
            const session = await this.mahjSessionRepository.getByOid(record.sessionId);
            if (!session || session.userId !== userId) {
                return new ApiResponse(false, null, 'forbidden');
            }
        }
        await this.gameRepository.remove(oid);
        return new ApiResponse(true, null);
    }
}
