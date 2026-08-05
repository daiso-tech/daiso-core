import { type TNode, type TEdge } from "@/di/implementations/utils.js";

export class Graph<TNodeProp, TEdgeProp> {
    private nodeProps = new Map<TNode, TNodeProp>();
    private edgeProps = new Map<TNode, Map<TNode, TEdgeProp>>();

    constructor(args?: {
        nodeProps?: Array<[TNode, TNodeProp]>;
        edgeProps?: Array<[TEdge, TEdgeProp]>;
    }) {
        const nodeProps = args?.nodeProps;
        const edgeProps = args?.edgeProps;

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
    /**
     * Make new Graph copy that includes its edges and nodes.
     * The new Graph have no parent link set.
     * @returns
     */
    public copy(): Graph<TNodeProp, TEdgeProp> {
        const nodeProps = this.nodes().map(
            (node) =>
                [node, this.getNodePropertyOrThrow(node)] satisfies [
                    TNode,
                    TNodeProp,
                ],
        );
        const edgeProps = this.edges().map(
            (edge) =>
                [edge, this.getEdgePropertyOrThrow(edge)] satisfies [
                    TEdge,
                    TEdgeProp,
                ],
        );

        return new Graph({ edgeProps, nodeProps });
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

    hasNodeProperty(node: TNode): boolean {
        return this.nodeProps.has(node);
    }

    hasEdgeProperty(edge: TEdge): boolean {
        return this.edgeProps.get(edge[0])?.has(edge[1]) ?? false;
    }

    getNodeProperty(nodeId: TNode): TNodeProp | null {
        return this.nodeProps.get(nodeId) ?? null;
    }

    getEdgeProperty(edge: TEdge): TEdgeProp | null {
        return this.edgeProps.get(edge[0])?.get(edge[1]) ?? null;
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

    setNodeProperty(key: TNode, value: TNodeProp): void {
        this.nodeProps.set(key, value);
    }

    setEdgeProperty(edge: TEdge, value: TEdgeProp): void {
        const neighbor =
            this.edgeProps.get(edge[0]) ?? new Map<TNode, TEdgeProp>();
        neighbor.set(edge[1], value);
        this.edgeProps.set(edge[0], neighbor);
    }

    removeEdge(edge: TEdge): void {
        this.edgeProps.get(edge[0])?.delete(edge[1]);
    }

    removeNode(node: TNode): void {
        this.nodeProps.delete(node);
    }

    nodes(): Array<TNode> {
        return [...this.nodeProps.keys()];
    }

    edges(): Array<TEdge> {
        return [...this.edgeProps.entries()].flatMap(([node, neighborsMap]) =>
            [...neighborsMap.keys()].map(
                (neighborNode) => [node, neighborNode] satisfies TEdge,
            ),
        );
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
