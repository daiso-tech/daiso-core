import {
    type ServiceFactory,
    type DiToken,
    type LIFESPAN,
} from "@/di/contracts/container.contract.js";
export type EdgeProps = {
    argIndex: number;
};

export type TEdge = [DiToken, DiToken];
export type TNode = DiToken;

export type DynamicNodeProps = {
    lifespan: typeof LIFESPAN.DYNAMIC;
};

export type ScopedNodeProps = {
    lifespan: typeof LIFESPAN.SCOPED;
    service: ServiceFactory;
};

export type TransientNodeProps = {
    lifespan: typeof LIFESPAN.TRANSIENT;
    service: ServiceFactory;
};

export type SingletonNodeProps = {
    lifespan: typeof LIFESPAN.SINGLETON;
    service: ServiceFactory;
};

export type NodeProps =
    | DynamicNodeProps
    | ScopedNodeProps
    | TransientNodeProps
    | SingletonNodeProps;
