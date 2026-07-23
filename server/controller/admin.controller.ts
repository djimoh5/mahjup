import { BaseController, Post, Get, Request, Response, AllowAnonymous, NoAuth } from './base.controller';

import { Bootstrap, Injectable } from '../config/bootstrap';

import { AdminService } from '../service/admin.service';

@Injectable()
@Bootstrap()
@AllowAnonymous()
export class AdminController extends BaseController {
	constructor(private adminService: AdminService) {
		super();
	}

	async init(_req: Request) {

	}

	@NoAuth()
	@Post('login')
	async login(req: Request, res: Response) {
		const { email, password } = req.body;
		if (!email || !password) {
			return this.sendError(res, 'email and password are required');
		}

		const data = this.adminService.login(email, password);
		if (data.success) {
			req.session.user = data.data;
			await this.init(req);
			req.session.start(data.data);
		}

		res.send(data);
	}

	@Get('data')
	async data(req: Request, res: Response) {
		if (!req.session.user?.isAdmin) {
			return this.forbiddenAccess(res);
		}

		const data = await this.adminService.getAllData();
		res.send(data);
	}
}
