import {
    LIFETIME,
    type IServiceRegister,
    type IServiceProvider,
} from "eridu-tech/di/contracts";

// As a plain function
function loggingProvider(register: IServiceRegister): void {
    register.registerFactory({
        token: Logger,
        factory: () => new Logger(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });

    register.registerFactory({
        token: FileLogger,
        factory: () => new FileLogger(),
        deps: {},
        lifetime: LIFETIME.SINGLETON,
    });
}

// As a class with an invoke(register: IServiceRegister) method
class DatabaseProvider implements IServiceProvider {
    invoke(register: IServiceRegister): void {
        register.registerFactory({
            token: Database,
            factory: () => new Database(),
            deps: {},
            lifetime: LIFETIME.SINGLETON,
        });

        register.registerFactory({
            token: UserRepository,
            factory: ({ db }) => new UserRepository(db),
            deps: { db: Database },
            lifetime: LIFETIME.SCOPED,
        });
    }
}

// Register providers
container.registerProvider(loggingProvider);
container.registerProvider(new DatabaseProvider());
