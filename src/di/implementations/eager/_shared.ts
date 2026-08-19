import {
    type ServiceFactory,
    type DiToken,
    LIFETIME,
} from "@/di/contracts/container.contract.js";
export type EdgeProps = {
    argIndex: number | string;
};

export type TEdge = [DiToken, DiToken];
export type TNode = DiToken;

export type DynamicNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.DYNAMIC;
};

export type ScopedNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.SCOPED;
    service: ServiceFactory;
};

export type TransientNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.TRANSIENT;
    service: ServiceFactory;
};

export type SingletonNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.SINGLETON;
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

export const INTERNAL_LIFETIME = {
    ...LIFETIME,
    DYNAMIC: "dynamic",
} as const;
/**
 * @internal
 */

export type InternalLifetime =
    (typeof INTERNAL_LIFETIME)[keyof typeof INTERNAL_LIFETIME];
