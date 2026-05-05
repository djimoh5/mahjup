import { Bootstrap, Injectable } from '../config/bootstrap';
import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';
import { MahjSessionRepository } from '../respository/mahj-session.repository';
import { GameRepository } from '../respository/game.repository';
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
        const sessions = await this.mahjSessionRepository.getByUser(userId);
        return new ApiResponse(true, sessions ?? []);
    }

    async save(session: MahjSession, userId: string): Promise<ApiResponse<MahjSession>> {
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
