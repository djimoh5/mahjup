import { Bootstrap, Injectable } from '../config/bootstrap';
import { BaseRepository } from './base.repository';
import { GameAnalysis } from '../../model/game-analysis.model';

@Injectable()
@Bootstrap()
export class GameAnalysisRepository extends BaseRepository {
    constructor() {
        super('game_analysis');
    }

    getByUser(userId: string): Promise<GameAnalysis> {
        return this.context.findOne({ userId });
    }

    save(analysis: GameAnalysis): Promise<GameAnalysis> {
        return super.updateObject(analysis);
    }
}
