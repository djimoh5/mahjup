import { authid, uniqueid } from './id.model';
import { GameRecord } from './game.model';
import { MahjSession } from './mahj-session.model';

export type GameAnalysisTimeRange = 'all' | 'week' | 'weeks2' | 'month' | 'months2' | 'months3' | 'months6' | 'year';

export interface GameAnalysisFilters {
    timeRange: GameAnalysisTimeRange;
    playerIds: string[]; // a game is included if ANY of these players appear in it
}

export interface GameAnalysis {
    oid?: uniqueid;
    userId: authid;
    filters: GameAnalysisFilters;
    filtersKey: string;
    gameIds: uniqueid[];
    gameIdsKey: string;
    content: string;
    _tsu?: number;
}

export const DEFAULT_GAME_ANALYSIS_FILTERS: GameAnalysisFilters = { timeRange: 'all', playerIds: [] };

export function normalizeGameAnalysisFilters(filters?: Partial<GameAnalysisFilters>): GameAnalysisFilters {
    return {
        timeRange: filters?.timeRange ?? 'all',
        playerIds: [...new Set(filters?.playerIds ?? [])].sort(),
    };
}

export function gameAnalysisFiltersKey(filters: GameAnalysisFilters): string {
    return `${filters.timeRange}|${filters.playerIds.join(',')}`;
}

// Identity for "the same underlying data" regardless of which filter combination produced it —
// e.g. "All Time" and "Past Year" select the same games if all games happen to be under a year old.
export function gameIdsSetKey(gameIds: string[]): string {
    return [...new Set(gameIds)].sort().join(',');
}

// Documents saved before per-filter/data-identity support are missing filters/filtersKey/gameIdsKey.
// Backfills them to "All Time, All Players" on the fly. Used both server-side (as a safety net
// independent of whether the one-off DB migration has run yet) and client-side (as a safety net
// independent of whether the server has been redeployed with this normalization yet).
export function normalizeGameAnalysis(analysis: GameAnalysis): GameAnalysis {
    if (analysis.filters && analysis.filtersKey && analysis.gameIdsKey) return analysis;

    const filters = analysis.filters && analysis.filtersKey ? analysis.filters : normalizeGameAnalysisFilters(analysis.filters);
    const filtersKey = analysis.filtersKey ?? gameAnalysisFiltersKey(filters);
    const gameIdsKey = analysis.gameIdsKey ?? gameIdsSetKey(analysis.gameIds ?? []);
    return { ...analysis, filters, filtersKey, gameIdsKey };
}

function cutoffDateString(timeRange: GameAnalysisTimeRange): string | null {
    if (timeRange === 'all') return null;

    const now = new Date();
    const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    switch (timeRange) {
        case 'week': cutoff.setUTCDate(cutoff.getUTCDate() - 7); break;
        case 'weeks2': cutoff.setUTCDate(cutoff.getUTCDate() - 14); break;
        case 'month': cutoff.setUTCMonth(cutoff.getUTCMonth() - 1); break;
        case 'months2': cutoff.setUTCMonth(cutoff.getUTCMonth() - 2); break;
        case 'months3': cutoff.setUTCMonth(cutoff.getUTCMonth() - 3); break;
        case 'months6': cutoff.setUTCMonth(cutoff.getUTCMonth() - 6); break;
        case 'year': cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1); break;
    }

    const y = cutoff.getUTCFullYear();
    const m = String(cutoff.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cutoff.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function filterRecordsForAnalysis(records: GameRecord[], sessions: MahjSession[], userId: string, filters: GameAnalysisFilters): GameRecord[] {
    const sessionMap = Object.fromEntries(sessions.map(s => [s.oid, s]));
    const cutoff = cutoffDateString(filters.timeRange);

    return records.filter(r => {
        if (!(r.players ?? []).some(p => p.userId === userId)) return false;

        if (cutoff) {
            const session = sessionMap[r.sessionId];
            const dateStr = session ? session.dateTime.split('T')[0] : r.date;
            if (dateStr < cutoff) return false;
        }

        if (filters.playerIds.length > 0 && !filters.playerIds.some(pid => (r.players ?? []).some(p => p.userId === pid))) {
            return false;
        }

        return true;
    });
}