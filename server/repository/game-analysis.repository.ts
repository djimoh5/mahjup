import { Bootstrap, Injectable } from '../config/bootstrap';
import { BaseRepository } from './base.repository';
import { SortOrder } from '../database/operations';
import { GameAnalysis, gameAnalysisFiltersKey, DEFAULT_GAME_ANALYSIS_FILTERS } from '../../model/game-analysis.model';

@Injectable()
@Bootstrap()
export class GameAnalysisRepository extends BaseRepository {
    constructor() {
        super('game_analysis');
    }

    getAllByUser(userId: string): Promise<GameAnalysis[]> {
        return this.context.find({ userId }, null, { sort: { _tsu: SortOrder.Descending } });
    }

    getAll(): Promise<GameAnalysis[]> {
        return this.context.find({}, null, { sort: { _tsu: SortOrder.Descending } });
    }

    getByUserAndFilters(userId: string, filtersKey: string): Promise<GameAnalysis> {
        // Legacy documents saved before per-filter support have no filtersKey field.
        // They represent the "default" (all-time, no player filter) analysis, so they
        // self-heal in place the first time that filter combination is regenerated.
        if (filtersKey === gameAnalysisFiltersKey(DEFAULT_GAME_ANALYSIS_FILTERS)) {
            return this.context.findOne({ userId, filtersKey: { $in: [filtersKey, null] } });
        }
        return this.context.findOne({ userId, filtersKey });
    }

    getByOid(oid: string): Promise<GameAnalysis> {
        return this.context.findOne({ oid });
    }

    // Documents saved before per-filter/data-identity support have no filtersKey field —
    // used by the one-off backfill job (see server/jobs/backfill-game-analysis.job.ts).
    getLegacy(): Promise<GameAnalysis[]> {
        return this.context.find({ $or: [{ filtersKey: { $exists: false } }, { filtersKey: null }] });
    }

    backfillLegacy(oid: string, patch: Pick<GameAnalysis, 'filters' | 'filtersKey' | 'gameIdsKey'>): Promise<any> {
        return this.context.update({ oid }, { ...patch }, null);
    }

    save(analysis: GameAnalysis): Promise<GameAnalysis> {
        return super.updateObject(analysis);
    }

    remove(oid: string): Promise<boolean> {
        return super.removeObject(oid);
    }
}
