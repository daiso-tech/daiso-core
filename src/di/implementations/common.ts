import {
    type ServiceFactory,
    type DiToken,
    LIFESPAN,
} from "@/di/contracts/container.contract.js";
export type EdgeProps = {
    argIndex: number | string;
};

export type TEdge = [DiToken, DiToken];
export type TNode = DiToken;

export type DynamicNodeProps = {
    lifespan: typeof INTERNAL_LIFESPAN.DYNAMIC;
};

export type ScopedNodeProps = {
    lifespan: typeof INTERNAL_LIFESPAN.SCOPED;
    service: ServiceFactory;
};

export type TransientNodeProps = {
    lifespan: typeof INTERNAL_LIFESPAN.TRANSIENT;
    service: ServiceFactory;
};

export type SingletonNodeProps = {
    lifespan: typeof INTERNAL_LIFESPAN.SINGLETON;
    service: ServiceFactory;
};

export type NodeProps =
    | DynamicNodeProps
    | ScopedNodeProps
    | TransientNodeProps
    | SingletonNodeProps;

/**
 * @internal
 */

export const INTERNAL_LIFESPAN = {
    ...LIFESPAN,
    DYNAMIC: "dynamic",
} as const;
/**
 * @internal
 */

export type InternalLifespan =
    (typeof INTERNAL_LIFESPAN)[keyof typeof INTERNAL_LIFESPAN];
