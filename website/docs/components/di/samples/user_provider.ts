import { IDatabase } from "./database";

export interface User {
    firstName: string;
    lastName: string;
    email: string;
    id: string;
}

export class UserProvider {
    constructor(private database: IDatabase) {
        /* ... */
    }

    getUser(id: string): User {
        /* ... */
        return {
            email: "someone@email.com",
            firstName: "some",
            lastName: "one",
            id: "000001",
        };
    }
}
