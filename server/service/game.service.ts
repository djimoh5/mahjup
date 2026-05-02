import { Bootstrap, Injectable } from '../config/bootstrap';
import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';
import { GameRepository } from '../respository/game.repository';
import { GameRecord } from '../../model/game.model';

@Injectable()
@Bootstrap()
export class GameService extends BaseService {
    constructor(protected appService: AppService, private gameRepository: GameRepository) {
        super(appService);
    }

    async getByUser(userId: string): Promise<ApiResponse<GameRecord[]>> {
        const records = await this.gameRepository.getByUser(userId);
        return new ApiResponse(true, records ?? []);
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
            return new ApiResponse(false, null, 'forbidden');
        }
        await this.gameRepository.remove(oid);
        return new ApiResponse(true, null);
    }
}
