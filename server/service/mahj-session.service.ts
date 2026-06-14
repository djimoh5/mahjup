import { Bootstrap, Injectable } from '../config/bootstrap';
import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';
import { MahjSessionRepository } from '../repository/mahj-session.repository';
import { GameRepository } from '../repository/game.repository';
import { MahjSession } from '../../model/mahj-session.model';

@Injectable()
@Bootstrap()
export class MahjSessionService extends BaseService {
    constructor(
        protected appService: AppService,
        private mahjSessionRepository: MahjSessionRepository,
        private gameRepository: GameRepository
    ) {
        super(appService);
    }

    async getByUser(userId: string): Promise<ApiResponse<MahjSession[]>> {
        const sessionsByMembership = await this.mahjSessionRepository.getByUser(userId);
        const gamesByParticipation = await this.gameRepository.getByParticipant(userId);
        const participantSessionIds = [...new Set(gamesByParticipation.map(g => g.sessionId))];
        const membershipOids = new Set(sessionsByMembership.map(s => s.oid as string));
        const missingIds = participantSessionIds.filter(id => !membershipOids.has(id));
        const sessionsByParticipation = missingIds.length > 0
            ? await this.mahjSessionRepository.getByOids(missingIds)
            : [];
        return new ApiResponse(true, [...(sessionsByMembership ?? []), ...sessionsByParticipation]);
    }

    async save(session: MahjSession, userId: string): Promise<ApiResponse<MahjSession>> {
        if (session.oid) {
            const existing = await this.mahjSessionRepository.getByOid(session.oid as string);
            if (existing && existing.userId && existing.userId !== userId) {
                return new ApiResponse(false, null, 'forbidden');
            }
        }
        session.userId = userId;
        const saved = await this.mahjSessionRepository.save(session);
        return new ApiResponse(true, saved);
    }

    async remove(oid: string, userId: string): Promise<ApiResponse<null>> {
        const session = await this.mahjSessionRepository.getByOid(oid);
        if (!session) {
            return new ApiResponse(false, null, 'session not found');
        }
        if (session.userId !== userId) {
            return new ApiResponse(false, null, 'forbidden');
        }
        await this.gameRepository.removeBySession(oid);
        await this.mahjSessionRepository.remove(oid);
        return new ApiResponse(true, null);
    }
}
