import { type TNode, type TEdge } from "@/di/implementations/utils.js";

const stopParentSearch = Symbol("represents removed value");
type TStopSearchSymbol = typeof stopParentSearch;

export class Graph<TNodeProp, TEdgeProp> {
    private nodeProps = new Map<TNode, TNodeProp | TStopSearchSymbol>();
    private edgeProps = new Map<
        TNode,
        Map<TNode, TEdgeProp | TStopSearchSymbol>
    >();

    private parentGraphOriginal?:
        | Graph<TNodeProp, TEdgeProp>
        | (() => Graph<TNodeProp, TEdgeProp>);

    private get parentGraph(): Graph<TNodeProp, TEdgeProp> | undefined {
        if (this.parentGraphOriginal === undefined) {
            return undefined;
        }

        if (this.parentGraphOriginal instanceof Graph) {
            return this.parentGraphOriginal;
        }

        return this.parentGraphOriginal();
    }

    constructor(args?: {
        nodeProps?: Array<[TNode, TNodeProp]>;
        edgeProps?: Array<[TEdge, TEdgeProp]>;
        parentGraph?:
            | Graph<TNodeProp, TEdgeProp>
            | (() => Graph<TNodeProp, TEdgeProp>);
    }) {
        const nodeProps = args?.nodeProps;
        const edgeProps = args?.edgeProps;
        this.parentGraphOriginal = args?.parentGraph;

        if (nodeProps !== undefined) {
            this.throwIfDuplicateNodesFound(nodeProps);

            for (const [node, property] of nodeProps) {
                this.setNodeProperty(node, property);
            }
        }

        if (edgeProps !== undefined) {
            this.throwIfDuplicateEdgeFound(edgeProps);

            for (const [edge, property] of edgeProps) {
                this.setEdgeProperty(edge, property);
            }
        }
    }

    private throwIfDuplicateNodesFound(props: Array<[TNode, TNodeProp]>) {
        const nodeSet = new Set<TNode>();

        for (const [node, _] of props) {
            const nodeExist = nodeSet.has(node);
            if (nodeExist) {
                throw new Error();
            }

            nodeSet.add(node);
        }
    }

    private throwIfDuplicateEdgeFound(props: Array<[TEdge, TEdgeProp]>) {
        const edgesMap = new Map<TNode, Set<TNode>>();

        for (const [[node0, node1], _] of props) {
            const edgeExist = edgesMap.get(node0)?.has(node1) === true;

            if (edgeExist) {
                throw new Error();
            }

            const neighbors = edgesMap.get(node0) ?? new Set<TNode>();
            neighbors.add(node1);
            edgesMap.set(node0, neighbors);
        }
    }

    private edgesAtCurrentLayer(): Array<TEdge> {
        const edges = [...this.edgeProps.entries()]
            .flatMap(([node, neighborsMap]) => {
                return [...neighborsMap.keys()].map(
                    (neighborNode) => [node, neighborNode] satisfies TEdge,
                );
            })
            .filter((item) => this.getEdgeProperty(item) !== null);

        return edges;
    }

    private nodesAtCurrentLayer(): Array<TNode> {
        return [...this.nodeProps.keys()].filter(
            (item) => this.getNodeProperty(item) !== null,
        );
    }

    private hasNodePropertyAtCurrentLayer(node: TNode): boolean {
        return this.nodeProps.has(node);
    }

    private hasEdgePropertyAtCurrentLayer(edge: TEdge): boolean {
        return this.edgeProps.get(edge[0])?.has(edge[1]) ?? false;
    }

    private getEdgePropertyAtCurrentLayer(
        edge: TEdge,
    ): TEdgeProp | null | TStopSearchSymbol {
        return this.edgeProps.get(edge[0])?.get(edge[1]) ?? null;
    }

    private getNodePropertyAtCurrentLayer(
        nodeId: TNode,
    ): TNodeProp | null | TStopSearchSymbol {
        return this.nodeProps.get(nodeId) ?? null;
    }

    hasNodeProperty(node: TNode): boolean {
        const value = this.getNodePropertyAtCurrentLayer(node);

        if (value === stopParentSearch) {
            return false;
        }

        if (value !== null) {
            return true;
        }

        if (this.parentGraph === undefined) {
            return false;
        }

        return this.parentGraph.hasNodeProperty(node);
    }

    hasEdgeProperty(edge: TEdge): boolean {
        const value = this.getEdgePropertyAtCurrentLayer(edge);

        if (value === stopParentSearch) {
            return false;
        }

        if (value !== null) {
            return true;
        }

        if (this.parentGraph === undefined) {
            return false;
        }

        return this.parentGraph.hasEdgeProperty(edge);
    }

    getNodeProperty(nodeId: TNode): TNodeProp | null {
        const value = this.getNodePropertyAtCurrentLayer(nodeId);

        if (value === stopParentSearch) {
            return null;
        }

        if (value !== null) {
            return value;
        }

        if (this.parentGraph === undefined) {
            return null;
        }

        return this.parentGraph.getNodeProperty(nodeId);
    }

    getEdgeProperty(edge: TEdge): TEdgeProp | null {
        const value = this.getEdgePropertyAtCurrentLayer(edge);

        if (value === stopParentSearch) {
            return null;
        }

        if (value !== null) {
            return value;
        }

        if (this.parentGraph === undefined) {
            return null;
        }

        return this.parentGraph.getEdgeProperty(edge);
    }

    getNodePropertyOrThrow(key: TNode): TNodeProp {
        const value = this.getNodeProperty(key);
        if (value === null) {
            throw new Error();
        }
        return value;
    }

    getEdgePropertyOrThrow(edge: TEdge): TEdgeProp {
        const value = this.getEdgeProperty(edge);
        if (value === null) {
            throw new Error();
        }
        return value;
    }

    private setNodePropertyOrStopSymbol(
        key: TNode,
        value: TNodeProp | TStopSearchSymbol,
    ): void {
        this.nodeProps.set(key, value);
    }

    setNodeProperty(key: TNode, value: TNodeProp): void {
        this.setNodePropertyOrStopSymbol(key, value);
    }

    private setEdgePropertyOrStopSymbol(
        edge: TEdge,
        value: TEdgeProp | TStopSearchSymbol,
    ): void {
        const neighbor =
            this.edgeProps.get(edge[0]) ?? new Map<TNode, TEdgeProp>();
        neighbor.set(edge[1], value);
        this.edgeProps.set(edge[0], neighbor);
    }

    setEdgeProperty(edge: TEdge, value: TEdgeProp): void {
        this.setEdgePropertyOrStopSymbol(edge, value);
    }

    removeEdge(edge: TEdge): void {
        this.setEdgePropertyOrStopSymbol(edge, stopParentSearch);
    }

    removeNode(node: TNode): void {
        this.setNodePropertyOrStopSymbol(node, stopParentSearch);
    }

    nodes(): Array<TNode> {
        const currentNodes = this.nodesAtCurrentLayer();
        const parentNodes = this.parentGraph?.nodes() ?? [];
        const nodesOnlyInParent = parentNodes.filter((node) => {
            const value = this.getNodePropertyAtCurrentLayer(node);
            const explicitExclude = value === stopParentSearch;

            if (explicitExclude) {
                return false;
            }

            const onlyInParent = value === null;

            if (onlyInParent) {
                return true;
            }
            return false;
        });
        return [...currentNodes, ...nodesOnlyInParent];
    }

    edges(): Array<TEdge> {
        const currentEdges = this.edgesAtCurrentLayer();
        const parentEdges = this.parentGraph?.edges() ?? [];
        const edgesOnlyInParent = parentEdges.filter((edge) => {
            const value = this.getEdgePropertyAtCurrentLayer(edge);
            const explicitExclude = value === stopParentSearch;

            if (explicitExclude) {
                return false;
            }

            const onlyInParent = value === null;

            if (onlyInParent) {
                return true;
            }
            return false;
        });

        return [...currentEdges, ...edgesOnlyInParent];
    }

    getSuccessorEdgesOf(node: TNode): Array<TEdge> {
        return this.edges().filter((item) => item[0] === node);
    }

    getPredecessorEdgesOf(node: TNode): Array<TEdge> {
        return this.edges().filter((item) => item[1] === node);
    }

    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.getPredecessorEdgesOf(node).map(([source, _]) => source);
    }

    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.getSuccessorEdgesOf(node).map(([_, neighbor]) => neighbor);
    }
}

export class GraphManager<TNodeProps, TEdgeProps> {
    private baseGraph = new Graph<TNodeProps, TEdgeProps>();
    private overrideGraph = new Graph<TNodeProps, TEdgeProps>({
        parentGraph: this.baseGraph,
    });

    setNodeProperty(key: TNode, value: TNodeProps): void {
        this.baseGraph.setNodeProperty(key, value);
    }

    setEdgeProperty(edge: TEdge, value: TEdgeProps): void {
        this.baseGraph.setEdgeProperty(edge, value);
    }

    setNodePropertyInOverrideLayer(key: TNode, value: TNodeProps): void {
        this.overrideGraph.setNodeProperty(key, value);
    }

    setEdgePropertyInOverrideLayer(edge: TEdge, value: TEdgeProps): void {
        this.overrideGraph.setEdgeProperty(edge, value);
    }

    removeEdgeFromOverrideLayer(edge: TEdge): void {
        this.overrideGraph.removeEdge(edge);
    }
    removeNodeFromOverrideLayer(node: TNode): void {
        this.overrideGraph.removeNode(node);
    }

    hasNodeProperty(node: TNode): boolean {
        return this.overrideGraph.hasNodeProperty(node);
    }
    hasEdgeProperty(edge: TEdge): boolean {
        return this.overrideGraph.hasEdgeProperty(edge);
    }
    getNodeProperty(nodeId: TNode): TNodeProps | null {
        return this.overrideGraph.getNodeProperty(nodeId);
    }

    getEdgeProperty(edge: TEdge): TEdgeProps | null {
        return this.overrideGraph.getEdgeProperty(edge);
    }

    getNodePropertyOrThrow(key: TNode): TNodeProps {
        return this.overrideGraph.getNodePropertyOrThrow(key);
    }

    getEdgePropertyOrThrow(edge: TEdge): TEdgeProps {
        return this.overrideGraph.getEdgePropertyOrThrow(edge);
    }
    nodes(): Array<TNode> {
        return this.overrideGraph.nodes();
    }
    edges(): Array<TEdge> {
        return this.overrideGraph.edges();
    }
    getSuccessorEdgesOf(node: TNode): Array<TEdge> {
        return this.overrideGraph.getSuccessorEdgesOf(node);
    }
    getPredecessorEdgesOf(node: TNode): Array<TEdge> {
        return this.overrideGraph.getPredecessorEdgesOf(node);
    }
    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.overrideGraph.getPredecessorsOf(node);
    }
    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.overrideGraph.getSuccessorsOf(node);
    }


    
}
