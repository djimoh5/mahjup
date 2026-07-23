import { BaseModel } from './shared.model';
import { authid, uniqueid } from './id.model';

export interface UserSummary {
    oid: authid;
    username: string;
    firstName?: string;
    lastName?: string;
    virtual?: boolean;
    _ts?: number;
}

export interface User {
    oid: string;
    token?: string;
    username?: string;
    isAdmin?: boolean;
    _ts?: number;
}

export class UserProfile implements BaseModel {
    oid?: uniqueid;
    authOid: authid;
    firstName: string;
    lastName: string;
}

export class UserHeaderKey {
    static Authorization: string = 'Authorization';
    static AppAuthorization: string = 'App-Authorization';
    static UserAgent = 'user-agent';
    static CacheVersionId = 'cache-version';
    static RateLimiter = 'rate-limit';
}
