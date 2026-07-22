import { BaseConfig } from '../config/config.base';
BaseConfig.FORCE_ENABLE_CONSOLE_LOG = true;

import { JobRunner, JobRunnerContext } from './job.runner';
import { BackfillGameAnalysisJob } from './backfill-game-analysis.job';

new JobRunner(JobRunnerContext.Script, [[BackfillGameAnalysisJob]]);

// One-off backfill for pre-filter game_analysis documents: sets filters to
// { timeRange: 'all', playerIds: [] } (All Time, All Players) and derives
// filtersKey/gameIdsKey from the existing gameIds. Idempotent — already-backfilled
// documents (with a filtersKey) are skipped, so it's safe to re-run.
//
// Run against local dev DB:
//   cd server && npx ts-node --project tsconfig.json jobs/backfill-game-analysis.app.ts
//
// Run against production (adjust flag to whichever config points at prod, e.g. --release):
//   cd server && npx ts-node --project tsconfig.json jobs/backfill-game-analysis.app.ts --release
