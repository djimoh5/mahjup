export interface MahjSession {
    oid: string;
    userId?: string;
    dateTime: string;     // YYYY-MM-DDTHH:mm
    title?: string;
    players: string[];
    notes?: string;
}
