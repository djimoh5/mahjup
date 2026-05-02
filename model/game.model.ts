export interface GameRecord {
    oid: string;
    userId?: string;   // stamped by the backend from session; not required from the client
    date: string;
    category: string;
    hand: string;
    wl: 'Win' | 'Loss';
    score: number;
    opponents: string;
    notes: string;
}
