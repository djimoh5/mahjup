import { Bootstrap, Injectable } from '../config/bootstrap';
import { AppService } from './app.service';
import { BaseService, ApiResponse } from './base.service';
import { AuthRepository } from '../repository/auth.repository';
import { UserProfileRepository } from '../repository/user-profile.repository';
import { MahjSessionRepository } from '../repository/mahj-session.repository';
import { GameRepository } from '../repository/game.repository';
import { GameAnalysisRepository } from '../repository/game-analysis.repository';
import { InviteRepository } from '../repository/invite.repository';
import { User, UserSummary } from '../../model/user.model';
import { MahjSession } from '../../model/mahj-session.model';
import { GameRecord } from '../../model/game.model';
import { GameAnalysis } from '../../model/game-analysis.model';
import { Invite } from '../../model/invite.model';
import { Common } from '../../utility/common';

// Hardcoded until MahjUp has real admin accounts/roles — move to Secrets Manager before production.
const ADMIN_EMAIL = 'admin@mahjup.com';
const ADMIN_PASSWORD = 'm@h$upmb5$$$!';

export interface AdminData {
    users: UserSummary[];
    sessions: MahjSession[];
    records: GameRecord[];
    analyses: GameAnalysis[];
    invites: Invite[];
}

@Injectable()
@Bootstrap()
export class AdminService extends BaseService {
    constructor(
        protected appService: AppService,
        private authRepository: AuthRepository,
        private userProfileRepository: UserProfileRepository,
        private mahjSessionRepository: MahjSessionRepository,
        private gameRepository: GameRepository,
        private gameAnalysisRepository: GameAnalysisRepository,
        private inviteRepository: InviteRepository,
    ) {
        super(appService);
    }

    login(email: string, password: string): ApiResponse<User> {
        if (!email || email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            return new ApiResponse(false, null, 'Invalid email or password');
        }
        return new ApiResponse(true, { oid: 'admin', username: ADMIN_EMAIL, isAdmin: true });
    }

    async getAllData(): Promise<ApiResponse<AdminData>> {
        const [auths, sessions, records, analyses, invites] = await Promise.all([
            this.authRepository.getAll(),
            this.mahjSessionRepository.getAll(),
            this.gameRepository.getAll(),
            this.gameAnalysisRepository.getAll(),
            this.inviteRepository.getAll(),
        ]);

        const profiles = await this.userProfileRepository.getByAuthOids(auths.map(a => a.oid));
        const profileMap = Common.arrayToHashTable(profiles, 'authOid');

        const users: UserSummary[] = auths.map(a => ({
            oid: a.oid,
            username: a.username,
            firstName: profileMap[a.oid]?.firstName,
            lastName: profileMap[a.oid]?.lastName,
            virtual: a.virtual,
            _ts: a._ts,
        }));

        return new ApiResponse(true, { users, sessions, records, analyses, invites });
    }
}
