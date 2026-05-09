import { Common } from "../server/utility/common";
import { authid, AuthId } from "./id.model";

export class UserAuth {
    oid: authid;
    token?: string;
    firstName?: string;
    lastName?: string;

    constructor(public username: string, public password: string) {
        this.oid = AuthId(Common.uniqueId());
    }
}