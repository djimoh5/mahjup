import * as crypto from 'crypto';

import { Bootstrap, Injectable } from '../config/bootstrap';
import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';
import { AIService } from './ai/ai.service';
import { AuthService } from './auth.service';
import { GameService } from './game.service';
import { MahjSessionService } from './mahj-session.service';
import { GameAnalysisRepository } from '../repository/game-analysis.repository';

import { GameAnalysis, GameAnalysisFilters, normalizeGameAnalysisFilters, normalizeGameAnalysis, gameAnalysisFiltersKey, gameIdsSetKey, filterRecordsForAnalysis } from '../../model/game-analysis.model';
import { AIMaxTokens } from '../../model/ai.model';
import { authid, UniqueId } from '../../model/id.model';

@Injectable()
@Bootstrap()
export class GameAnalysisService extends BaseService {
    constructor(
        protected appService: AppService,
        private aiService: AIService,
        private authService: AuthService,
        private gameService: GameService,
        private mahjSessionService: MahjSessionService,
        private gameAnalysisRepository: GameAnalysisRepository,
    ) {
        super(appService);
    }

    async analyze(userId: authid, username: string, rawFilters?: Partial<GameAnalysisFilters>): Promise<ApiResponse<GameAnalysis>> {
        const filters = normalizeGameAnalysisFilters(rawFilters);
        const filtersKey = gameAnalysisFiltersKey(filters);

        const [{ data: records }, { data: sessions }] = await Promise.all([
            this.gameService.getByUser(userId),
            this.mahjSessionService.getByUser(userId),
        ]);

        if (!records || records.length === 0) {
            // Not persisted — an empty-result message isn't a real summary and shouldn't
            // clutter a user's history or survive as a stale "Previous Summary."
            const empty: GameAnalysis = { userId, filters, filtersKey, gameIds: [], gameIdsKey: gameIdsSetKey([]), content: '<p>No games played yet — start tracking your Mahjong games to receive personalized AI insights!</p>' };
            return new ApiResponse(true, empty);
        }

        const filteredRecords = filterRecordsForAnalysis(records, sessions ?? [], userId, filters);

        if (filteredRecords.length === 0) {
            const empty: GameAnalysis = { userId, filters, filtersKey, gameIds: [], gameIdsKey: gameIdsSetKey([]), content: '<p>No games found matching these filters — try widening the time range or player selection.</p>' };
            return new ApiResponse(true, empty);
        }

        const sessionMap = Object.fromEntries((sessions ?? []).map(s => [s.oid, s]));

        const playerIds = [...new Set(filteredRecords.flatMap(r => (r.players ?? []).map(p => p.userId)).filter(Boolean))];
        const usersResult = await this.authService.getUsersByOids(playerIds);
        const nameMap: Record<string, string> = {};
        for (const u of usersResult.data ?? []) {
            nameMap[u.oid as string] = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.username;
        }

        const currentUserName = nameMap[userId] ?? username;

        const text = `The player being analyzed is: ${currentUserName}\n\n` + filteredRecords.map(r => {
            const session = sessionMap[r.sessionId];
            const sessionNotes = session?.notes ? `\n  Session notes: ${session.notes}` : '';
            const players = (r.players ?? []).map(p => {
                const name = nameMap[p.userId] ?? 'Unknown';
                const status = p.isWinner ? 'WINNER' : 'lost';
                return `  - ${name} (${status}): ${p.category} — "${p.hand}", ${p.jokers} jokers, score: ${p.score}${p.notes ? `, notes: ${p.notes}` : ''}`;
            }).join('\n');
            return `Game on ${r.date}:${sessionNotes}\n${players}`;
        }).join('\n\n');

        const result = await this.aiService.getTextCompletions([
            {
                content: `
                    Role & Perspective: Act as an elite American Mahjong Grandmaster, Strategy Consultant, and Data Scientist.
                    You have analyzed thousands of games played under National Mah Jongg League (NMJL) rules.
                    You specialize in interpreting game metrics to help players break bad habits, optimize tile retention, and increase their win percentage.

                    Objective: Perform a rigorous, multi-dimensional analysis on the user's historical match logs, Charleston choices, final hand selections, and opponent behaviors. Provide concrete, actionable adjustments to improve their win rate.

                    Methodology: When reviewing the user's data, evaluate the metrics through these critical strategic lenses:
                    Flexibility vs. Commitment: Did the user lock into a hand too early on the card (e.g., during the Charleston), forcing them into a dead end, or did they pivot gracefully?
                    Efficiency & Value: Did the hand they pursued maximize their tile odds relative to its difficulty and score value?
                    Defensive Awareness: Did they actively track remaining tiles, monitor opponent exposures (Pungs/Kongs), and hold safe tiles late in the game, or did they carelessly feed winning tiles to opponents?
                    Opponent Profiling: What tendencies do their opponents exhibit (e.g., hoarding Jokers, passing poorly in the Charleston, calling tiles too early)?
                    Output Constraints: Structure your analysis into these mandatory sections:
                    Performance Baseline: A blunt assessment of their current win/loss trends, joker utilization efficiency, and defensive rating based on the data.
                    The Pivot Point Analysis: Breakdown of where their games are won or lost—specifically focusing on Charleston decision-making and early-to-mid-game transitions.
                    Tactical Blind Spots: Highlight exactly what bad habits are killing their game (e.g., over-relying on a specific section of the card like Consecutive Runs, failing to count dead tiles, or misinterpreting opponent exposures).
                    Opponent Exploits: Specific ways to outplay the people they are playing against based on their tracking data.
                    The 3-Step Action Plan: Three precise, prioritized rules of thumb to apply in their very next game.
                    Tone: Elite, objective, highly strategic, and direct. Avoid generic gaming advice; everything must be specific to American Mahjong rules, tile distributions, and NMJL card dynamics.

                    Return the analysis as an HTML content fragment using appropriate headings, paragraphs, and bullet points. Use h2 tags for section headings, and p tags for body content. Do not apply any inline styling or style sheet as that will be handled separately by the consuming app. Do not include DOCTYPE, html, head, or body tags.
                `,
                role: 'system'
            },
            {
                content: text,
                role: 'user'
            }
        ], { model: 'gemini-3.5-flash', maxTokens: AIMaxTokens.Minimum }, userId);

        const content = result.data?.[0]?.message?.content ?? '';
        const gameIds = filteredRecords.map(r => r.oid).filter(Boolean);
        const gameIdsKey = gameIdsSetKey(gameIds);
        const saved = await this._upsert(userId, filters, filtersKey, gameIds, gameIdsKey, content);
        return new ApiResponse(result.success, saved);
    }

    async getAllByUser(userId: string): Promise<ApiResponse<GameAnalysis[]>> {
        const analyses = await this.gameAnalysisRepository.getAllByUser(userId) ?? [];
        // Legacy documents predate per-filter/data-identity support and are missing these
        // derived fields — backfill them on the fly rather than requiring a migration.
        const normalized = analyses.map(normalizeGameAnalysis);
        return new ApiResponse(true, normalized);
    }

    async remove(oid: string, userId: string): Promise<ApiResponse<null>> {
        const analysis = await this.gameAnalysisRepository.getByOid(oid);
        if (!analysis) {
            return new ApiResponse(false, null, 'summary not found');
        }
        if (analysis.userId !== userId) {
            return new ApiResponse(false, null, 'forbidden');
        }
        await this.gameAnalysisRepository.remove(oid);
        return new ApiResponse(true, null);
    }

    private async _upsert(userId: authid, filters: GameAnalysisFilters, filtersKey: string, gameIds: any[], gameIdsKey: string, content: string): Promise<GameAnalysis> {
        // Same filters as an existing summary -> replace it in place. Different filters
        // always create a distinct summary, even if they select the exact same underlying
        // games — filters are the sole identity here, matching the "same filters replace,
        // different filters coexist" rule (and what the UI shows for a given selection).
        const existing = await this.gameAnalysisRepository.getByUserAndFilters(userId, filtersKey);
        const analysis: GameAnalysis = {
            oid: existing?.oid ?? UniqueId(crypto.randomUUID()),
            userId,
            filters,
            filtersKey,
            gameIds,
            gameIdsKey,
            content,
        };
        return this.gameAnalysisRepository.save(analysis);
    }
}
