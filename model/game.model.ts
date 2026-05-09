export interface GameRecord {
    oid: string;
    userId?: string;
    sessionId: string;
    date: string;
    category: string;
    hand: string;
    winner: string;
    score: number;
    participants: string[];
    notes: string;
}
