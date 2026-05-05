export interface GameRecord {
    oid: string;
    userId?: string;
    sessionId: string;
    date: string;
    category: string;
    hand: string;
    wl: 'Win' | 'Loss';
    score: number;
    participants: string[];
    notes: string;
}
