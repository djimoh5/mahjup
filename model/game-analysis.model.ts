import { authid, uniqueid } from './id.model';

export interface GameAnalysis {
    oid?: uniqueid;
    userId: authid;
    gameIds: uniqueid[];
    content: string;
    _tsu?: number;
}
