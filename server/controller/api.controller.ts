import { BaseController, Post, Get, Delete, Request, Response, AllowAnonymous, NoAuth } from './base.controller';

import { Bootstrap, Injectable } from '../config/bootstrap';

import { AuthService } from '../service/auth.service';
import { GameService } from '../service/game.service';
import { MahjSessionService } from '../service/mahj-session.service';

import { ApiResponse } from '../../model/shared.model';
import { UserAuth } from '../../model/auth.model';

@Injectable()
@Bootstrap()
@AllowAnonymous()
export class APIController extends BaseController {
	constructor(private authService: AuthService, private gameService: GameService, private mahjSessionService: MahjSessionService) {
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