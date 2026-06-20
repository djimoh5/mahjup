import { BaseController, Post, Get, Delete, Request, Response, AllowAnonymous, NoAuth } from './base.controller';

import { Bootstrap, Injectable } from '../config/bootstrap';

import { AuthService } from '../service/auth.service';
import { GameService } from '../service/game.service';
import { MahjSessionService } from '../service/mahj-session.service';
import { UserProfileService } from '../service/user-profile.service';
import { AIService } from '../service/ai/ai.service';

import { ApiResponse } from '../../model/shared.model';
import { UserAuth } from '../../model/auth.model';
import { authid, AuthId } from '../../model/id.model';

@Injectable()
@Bootstrap()
@AllowAnonymous()
export class APIController extends BaseController {
	constructor(private authService: AuthService, private gameService: GameService, private mahjSessionService: MahjSessionService, private userProfileService: UserProfileService, private aiService: AIService) {
		super();
	}

	async init(_req: Request) {

	}

	@NoAuth()
	@Post('auth/create')
	async authenticateOrCreate(req: Request, res: Response) {
		this.completeAuthentication(req, res, req.body.username, req.body.password, true, false)
	}

	private async completeAuthentication(req: Request, res: Response, username: string, password: string, create: boolean, bypassPassword: boolean) {
		const data = await this.authService.authenticate(username, password, create, bypassPassword);
		if (data.success) {
			req.session.user = data.data;
			await this.init(req);
			req.session.start(data.data);
		}

		res.send(data);
	}

	@NoAuth()
	@Post('auth/update')
	async updateAuth(req: Request, res: Response) {
		const data = await this.authService.updateAuth(req.body.username, req.body.password, req.body.newPassword);
		res.send(data);
	}

	@NoAuth()
	@Post('auth')
	async authenticate(req: Request, res: Response) {
		let data: ApiResponse<UserAuth>;

		if (req.session.user && req.session.user.token) {
			data = await this.authService.authenticate(req.session.user.username, null, false, true);
		}
		else if (req.body) {
			console.log(req.body);
			data = await this.authService.authenticate(req.body.username, req.body.password);
		}

		if (!data) {
			return this.sendError(res, 'authentication failed');
		}

		if (data.success) {
			req.session.start(data.data);
		}

		res.send(data);
	}

	@NoAuth()
	@Post('auth/code/request')
	async requestLoginCode(req: Request, res: Response) {
		const { username } = req.body;
		if (!username) {
			return this.sendError(res, 'username is required');
		}
		const data = await this.authService.requestLoginCode(username);
		res.send(data);
	}

	@NoAuth()
	@Post('auth/code/verify')
	async verifyLoginCode(req: Request, res: Response) {
		const { username, code } = req.body;
		if (!username || !code) {
			return this.sendError(res, 'username and code are required');
		}
		const data = await this.authService.verifyLoginCode(username, code);
		if (data.success) {
			req.session.start(data.data);
		}
		res.send(data);
	}

	@NoAuth()
	@Post('auth/password/reset')
	async requestPasswordReset(req: Request, res: Response) {
		const { username } = req.body;
		if (!username) {
			return this.sendError(res, 'username is required');
		}
		const data = await this.authService.requestPasswordReset(username);
		res.send(data);
	}

	@NoAuth()
	@Post('auth/password/reset/confirm')
	async resetPassword(req: Request, res: Response) {
		const { username, code, newPassword } = req.body;
		if (!username || !code || !newPassword) {
			return this.sendError(res, 'username, code, and newPassword are required');
		}
		const data = await this.authService.resetPassword(username, code, newPassword);
		res.send(data);
	}

	@Get('user/affiliated')
	async getAffiliatedUsers(req: Request, res: Response) {
		const userId = req.session.user.oid;
		const [{ data: records }, inviteOids] = await Promise.all([
			this.gameService.getByUser(userId),
			this.authService.getInviteAffiliatedOids(userId, req.session.user.username),
		]);
		const playerIds = [...new Set(
			[userId, ...(records ?? []).flatMap(r => (r.players ?? []).map(p => p.userId)).filter(id => !!id), ...inviteOids]
		)];
		const data = await this.authService.getUsersByOids(playerIds);
		res.send(data);
	}

	@Get('user/profile')
	async getProfile(req: Request, res: Response) {
		const data = await this.userProfileService.getProfile(AuthId(req.session.user.oid));
		res.send(data);
	}

	@Post('user/profile')
	async updateProfile(req: Request, res: Response) {
		/*this.aiService.getTextCompletions([{
			content: 'What is Mahjong?',
			role: 'user'
		}], { model: 'claude-opus-4-7' }, <authid>req.session.user.oid);*/

		const { firstName, lastName } = req.body;
		if (!firstName || !lastName) {
			return this.sendError(res, 'First name and last name are required');
		}
		const profileResult = await this.userProfileService.updateProfile(AuthId(req.session.user.oid), firstName, lastName);
		if (!profileResult.success) return res.send(profileResult);
		const auth = { ...req.session.user, profile: profileResult.data };
		res.send(new ApiResponse(true, auth));
	}

	@Post('auth/invite')
	async invite(req: Request, res: Response) {
		const { username, sessionless } = req.body;
		if (!username) {
			return this.sendError(res, 'username is required');
		}
		const data = await this.authService.invite(username, <authid>req.session.user.oid, req.session.user.username, !!sessionless);
		res.send(data);
	}

	@NoAuth()
	@Post('auth/invite/redeem')
	async redeemInvite(req: Request, res: Response) {
		const { code } = req.body;
		if (!code) {
			return this.sendError(res, 'code is required');
		}
		const data = await this.authService.redeemInviteCode(code);
		if (data.success) {
			req.session.user = data.data;
			await this.init(req);
			req.session.start(data.data);
		}
		res.send(data);
	}

	@Get('game/records')
	async getRecords(req: Request, res: Response) {
		const data = await this.gameService.getByUser(req.session.user.oid);
		res.send(data);
	}

	@Post('game/record')
	async saveRecord(req: Request, res: Response) {
		const data = await this.gameService.save(req.body, req.session.user.oid);
		res.send(data);
	}

	@Delete('game/record/:oid')
	async deleteRecord(req: Request, res: Response) {
		const data = await this.gameService.remove(req.params.oid, req.session.user.oid);
		res.send(data);
	}

	@Get('mahj-session/list')
	async getSessions(req: Request, res: Response) {
		const data = await this.mahjSessionService.getByUser(req.session.user.oid);
		res.send(data);
	}

	@Post('mahj-session')
	async saveSession(req: Request, res: Response) {
		const data = await this.mahjSessionService.save(req.body, req.session.user.oid);
		res.send(data);
	}

	@Delete('mahj-session/:oid')
	async deleteSession(req: Request, res: Response) {
		const data = await this.mahjSessionService.remove(req.params.oid, req.session.user.oid);
		res.send(data);
	}
}