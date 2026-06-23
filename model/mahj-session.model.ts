import { authid, uniqueid } from './id.model';

export interface MahjSession {
    oid: uniqueid;
    userId?: string;
    dateTime: string;     // YYYY-MM-DDTHH:mm
    title?: string;
    players: authid[];
    notes?: string;
    _tsu?: number;
}
