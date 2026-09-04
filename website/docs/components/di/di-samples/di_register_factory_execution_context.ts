import { contextToken } from "eridu-tech/execution-context/contracts";

// A context token for the current request id
const REQUEST_ID = contextToken<string>("requestId");

class RequestService {
    constructor(private requestId: string) {
        /* ... */
    }
}

container.registerFactory({
    token: RequestService,
    deps: {},
    factory: (deps, executionContext) => {
        // Read a contextual value propagated through the resolution chain
        const requestId = executionContext.get(REQUEST_ID) ?? "unknown";
        return new RequestService(requestId);
    },
    lifetime: LIFETIME.TRANSIENT,
});
