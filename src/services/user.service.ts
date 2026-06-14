import { BaseService } from './base.service';
import type { UserSummary } from '../../model/user.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
}

export class UserService extends BaseService {
  async getAffiliated(): Promise<{ users: UserSummary[] }> {
    const res = await this.get<ApiResponse<UserSummary[]>>('/user/affiliated');
    return { users: res.data ?? [] };
  }
}

export const userService = new UserService();
