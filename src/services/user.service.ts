import { BaseService } from './base.service';
import type { UserSummary } from '../../model/user.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export class UserService extends BaseService {
  async getAll(): Promise<{ users: UserSummary[] }> {
    const res = await this.get<ApiResponse<UserSummary[]>>('/user/list');
    return { users: res.data ?? [] };
  }
}

export const userService = new UserService();
