import { uniqueid } from './id.model';

export interface MahjSession {
    oid: uniqueid;
    userId?: string;
    dateTime: string;     // YYYY-MM-DDTHH:mm
    title?: string;
    players: string[];
    notes?: string;
}
