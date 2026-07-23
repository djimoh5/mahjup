import { Bootstrap, Injectable } from '../config/bootstrap';
import { BaseRepository } from './base.repository';
import { MahjSession } from '../../model/mahj-session.model';

@Injectable()
@Bootstrap()
export class MahjSessionRepository extends BaseRepository {
    constructor() {
        super('mahj_session');
    }

    getByOid(oid: string): Promise<MahjSession> {
        return this.context.findOne({ oid });
    }

    getAll(): Promise<MahjSession[]> {
        return this.context.find({});
    }

    getByUser(userId: string): Promise<MahjSession[]> {
        return this.context.find({ $or: [{ userId }, { players: userId }] });
    }

    getByOids(oids: string[]): Promise<MahjSession[]> {
        return this.context.find({ oid: { $in: oids } });
    }

    save(session: MahjSession): Promise<MahjSession> {
        return super.updateObject(session);
    }

    remove(oid: string): Promise<boolean> {
        return super.removeObject(oid);
    }
}
