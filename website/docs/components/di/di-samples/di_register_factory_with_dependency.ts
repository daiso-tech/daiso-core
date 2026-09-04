interface User {
    firstName: string;
    lastName: string;
    email: string;
    id: string;
}

class UserProvider {
    constructor(private database: IDatabase) {
        /* ... */
    }

    getUser(id: string): User {
        /* ... */
    }
}

// `UserProvider` service requires `IDATABASE` dependency
container.registerFactory({
    token: UserProvider,
    deps: { db: IDATABASE },
    factory: (deps) => new UserProvider(deps.db),
    lifetime: LIFETIME.SINGLETON,
});
