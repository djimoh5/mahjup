import { Bootstrap, Injectable } from '../config/bootstrap';
import { Job } from '../../model/job.model';
import { GameAnalysisRepository } from '../repository/game-analysis.repository';
import { DEFAULT_GAME_ANALYSIS_FILTERS, gameAnalysisFiltersKey, gameIdsSetKey } from '../../model/game-analysis.model';

@Injectable()
@Bootstrap()
export class BackfillGameAnalysisJob extends Job {
    constructor(private gameAnalysisRepository: GameAnalysisRepository) {
        super('BackfillGameAnalysis');
    }

    async run(_context: { data?: any }) {
        try {
            const legacy = await this.gameAnalysisRepository.getLegacy();
            console.log(`Found ${legacy.length} legacy game_analysis document(s) to backfill`);

            const filters = DEFAULT_GAME_ANALYSIS_FILTERS;
            const filtersKey = gameAnalysisFiltersKey(filters);

            let updated = 0;
            for (const doc of legacy) {
                if (!doc.oid) {
                    console.log('Skipping document with no oid:', doc);
                    continue;
                }

                const gameIdsKey = gameIdsSetKey(doc.gameIds ?? []);
                await this.gameAnalysisRepository.backfillLegacy(doc.oid, { filters, filtersKey, gameIdsKey });
                updated++;
                console.log(`Backfilled ${doc.oid} (userId: ${doc.userId}) -> filtersKey="${filtersKey}", gameIdsKey="${gameIdsKey}"`);
            }

            this.done({ success: true, data: { found: legacy.length, updated } });
        }
        catch (err) {
            console.log(err);
            this.done({ success: false, data: err });
        }
    }
}
