import { uniqueid } from "./id.model";

export interface GameRecord {
    oid: uniqueid;
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
