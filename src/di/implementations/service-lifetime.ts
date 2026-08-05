import {
    type FactoryRegistration,
    type IServiceLifetime,
} from "@/di/contracts/_module-exports.js";
import { type GraphManager } from "@/di/implementations/graph-manager.js";
import { LIFESPAN } from "@/di/implementations/utils.js";

export class ServiceLifetimeSetter<
    TDeps extends Array<unknown> = [],
    TRegisteredType = unknown,
> implements IServiceLifetime
{
    private scopedAlready = false;

    private throwIfScopedSetTwice() {
        if (this.scopedAlready) {
            throw Error();
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
    }) {
        this.graphManager = args.graphManager;
        this.settings = args.settings;
        this.notifyLifetimeIsSet = args.notifyLifetimeIsSet;
    }

    singleton(): void {
        this.throwIfScopedSetTwice();
        this.graphManager.registerFactory(this.settings, LIFESPAN.SINGLETON);
    }
    scoped(): void {
        this.throwIfScopedSetTwice();
        this.graphManager.registerFactory(this.settings, LIFESPAN.SCOPED);
    }
    transient(): void {
        this.throwIfScopedSetTwice();
        this.graphManager.registerFactory(this.settings, LIFESPAN.TRANSIENT);
    }
}
