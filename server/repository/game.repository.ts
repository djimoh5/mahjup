import { Bootstrap, Injectable } from '../config/bootstrap';
import { BaseRepository } from './base.repository';
import { GameRecord } from '../../model/game.model';

@Injectable()
@Bootstrap()
export class GameRepository extends BaseRepository {
    constructor() {
        super('game');
    }

    getByOid(oid: string): Promise<GameRecord> {
        return this.context.findOne({ oid });
    }

    getByUser(userId: string): Promise<GameRecord[]> {
        return this.context.find({ userId });
    }

    getBySessions(sessionId: string[]): Promise<GameRecord[]> {
        return this.context.find({ sessionId: { $in: sessionId } });
    }

    save(record: GameRecord): Promise<GameRecord> {
        return super.updateObject(record);
    }

    remove(oid: string): Promise<boolean> {
        return super.removeObject(oid);
    }

    removeBySession(sessionId: string): Promise<boolean> {
        return this.context.remove({ sessionId }, null);
    }
}
