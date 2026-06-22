import { uniqueid } from "./id.model";

export interface PlayerHand {
    userId: string;
    category: string;
    hand: string;
    variant?: 's2';
    jokers: number;
    isWinner: boolean;
    score: number;
    notes?: string;
}

export interface GameRecord {
    oid: uniqueid;
    userId?: string;
    sessionId: string;
    date: string;
    players: PlayerHand[];
}
