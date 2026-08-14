import {
    type FactoryRegistration,
    type IServiceLifetime,
} from "@/di/contracts/_module-exports.js";
import { type GraphManager } from "@/di/implementations/graph-manager.js";
import {
    LIFESPAN,
    tokenToString,
    type TNode,
} from "@/di/implementations/utils.js";
import { UnexpectedError } from "@/utilities/errors.js";

export class ServiceLifetimeSetterError extends UnexpectedError {}

/**
 * Thrown when a service lifetime is configured more than once for the same
 * token. Only one of {@link ServiceLifetimeSetter.singleton}, `.scoped`, or
 * `.transient` may be called per registration.
 *
 * @group Errors
 */
export class LifeTimeSetTwiceError extends ServiceLifetimeSetterError {
    /**
     * The token whose lifetime was set more than once.
     */
    public readonly token: TNode;

    private constructor(token: TNode) {
        super(
            `Lifetime set twice for token: "${tokenToString(token)}". A service lifetime may only be configured once.`,
        );
        this.name = LifeTimeSetTwiceError.name;
        this.token = token;
    }

    /**
     * Creates a new {@link LifeTimeSetTwiceError} error.
     *
     * @param token - The token whose lifetime was set more than once.
     * @returns A new error instance.
     */
    static create(token: TNode): LifeTimeSetTwiceError {
        return new LifeTimeSetTwiceError(token);
    }
}

export class ServiceLifetimeSetter<
    TDeps extends Array<unknown> = [],
    TRegisteredType = unknown,
> implements IServiceLifetime
{
    private scopedAlready = false;
    private token: TNode;

    private throwIfLifetimeSetTwice() {
        if (this.scopedAlready) {
            throw LifeTimeSetTwiceError.create(this.token);
        }
        this.scopedAlready = true;
        this.notifyLifetimeIsSet();
    }
    private graphManager: GraphManager;
    private settings: FactoryRegistration<TDeps, TRegisteredType>;
    private notifyLifetimeIsSet: () => void;

    constructor(args: {
        graphManager: GraphManager;
        settings: FactoryRegistration<TDeps, TRegisteredType>;
        notifyLifetimeIsSet: () => void;
        token: TNode;
    }) {
        this.graphManager = args.graphManager;
        this.settings = args.settings;
        this.notifyLifetimeIsSet = args.notifyLifetimeIsSet;
        this.token = args.token;
    }

    singleton(): void {
        this.throwIfLifetimeSetTwice();
        this.graphManager.registerFactory(this.settings, LIFESPAN.SINGLETON);
    }
    scoped(): void {
        this.throwIfLifetimeSetTwice();
        this.graphManager.registerFactory(this.settings, LIFESPAN.SCOPED);
    }
    transient(): void {
        this.throwIfLifetimeSetTwice();
        this.graphManager.registerFactory(this.settings, LIFESPAN.TRANSIENT);
    }
}
