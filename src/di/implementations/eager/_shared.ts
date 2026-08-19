/**
 * @module DI
 */
import { LIFETIME } from "@/di/contracts/container.contract.js";

import type {
    ServiceFactory,
    DiToken,
    DepRecord,
} from "@/di/contracts/container.contract.js";

/**
 * @internal
 */
export type EdgeProps = {
    argIndex: number | string;
};

/**
 * @internal
 */
export type Edge = [DiToken, DiToken];
/**
 * @internal
 */
export type Node = DiToken;

/**
 * @internal
 */
export type DynamicNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.DYNAMIC;
};

/**
 * @internal
 */
export type ScopedNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.SCOPED;
    service: ServiceFactory<DepRecord>;
};

/**
 * @internal
 */
export type TransientNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.TRANSIENT;
    service: ServiceFactory<DepRecord>;
};

/**
 * @internal
 */
export type SingletonNodeProps = {
    lifetime: typeof INTERNAL_LIFETIME.SINGLETON;
    service: ServiceFactory<DepRecord>;
};

/**
 * @internal
 */
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
