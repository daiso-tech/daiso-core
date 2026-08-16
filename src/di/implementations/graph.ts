import {
    type TNode,
    type TEdge,
    tokenToString,
} from "@/di/implementations/utils.js";
import { UnexpectedError } from "@/utilities/_module.js";

const edgeToString = (edge: TEdge): string =>
    `[${tokenToString(edge[0])}, ${tokenToString(edge[1])}]`;

/**
 * A directed graph that stores arbitrary properties on its nodes and edges.
 */
export class Graph<TNodeProp = unknown, TEdgeProp = unknown> {
    private nodeProps = new Map<TNode, TNodeProp | null>();
    private edgeProps = new Map<TNode, Map<TNode, TEdgeProp | null>>();
    private reversedEdges = new Map<TNode, Set<TNode>>();

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
     * Creates a deep copy of this graph, including all of its nodes and edges.
     *
     * @returns A new {@link Graph} instance with the same nodes, edges, and properties.
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
        const duplicates: Array<TNode> = [];

        for (const [node, _] of props) {
            if (nodeSet.has(node)) {
                duplicates.push(node);
            }

            nodeSet.add(node);
        }

        if (duplicates.length > 0) {
            throw new UnexpectedError(
                `Duplicate nodes found in graph: "${duplicates
                    .map(tokenToString)
                    .join(", ")}". Each node must appear only once.`,
            );
        }
    }

    private throwIfDuplicateEdgeFound(props: Array<[TEdge, TEdgeProp]>) {
        const edgesMap = new Map<TNode, Set<TNode>>();
        const duplicates: Array<TEdge> = [];

        for (const [[sourceNode, targetNode], _] of props) {
            const edgeExist =
                edgesMap.get(sourceNode)?.has(targetNode) === true;

            if (edgeExist) {
                duplicates.push([sourceNode, targetNode]);
            }

            const neighbors = edgesMap.get(sourceNode) ?? new Set<TNode>();
            neighbors.add(targetNode);
            edgesMap.set(sourceNode, neighbors);
        }

        if (duplicates.length > 0) {
            throw new UnexpectedError(
                `Duplicate edges found in graph: "${duplicates
                    .map(edgeToString)
                    .join(", ")}". Each edge must appear only once.`,
            );
        }
    }

    hasNodeProperty(node: TNode): boolean {
        return this.getNodeProperty(node) !== null;
    }

    hasEdgeProperty(edge: TEdge): boolean {
        return this.getEdgeProperty(edge) !== null;
    }

    hasNode(node: TNode): boolean {
        return this.nodeProps.has(node);
    }

    hasEdge(edge: TEdge): boolean {
        const [sourceNode, targetNode] = edge;
        return this.edgeProps.get(sourceNode)?.has(targetNode) ?? false;
    }

    getNodeProperty(nodeId: TNode): TNodeProp | null {
        return this.nodeProps.get(nodeId) ?? null;
    }

    getEdgeProperty(edge: TEdge): TEdgeProp | null {
        const [sourceNode, targetNode] = edge;
        return this.edgeProps.get(sourceNode)?.get(targetNode) ?? null;
    }

    getNodePropertyOrThrow(key: TNode): TNodeProp {
        const value = this.getNodeProperty(key);
        if (value === null) {
            throw new UnexpectedError(
                `Node property not found for node: "${tokenToString(
                    key,
                )}". No property is registered for this node.`,
            );
        }
        return value;
    }

    getEdgePropertyOrThrow(edge: TEdge): TEdgeProp {
        const value = this.getEdgeProperty(edge);
        if (value === null) {
            throw new UnexpectedError(
                `Edge property not found for edge: "${edgeToString(
                    edge,
                )}". No property is registered for this edge.`,
            );
        }
        return value;
    }

    setNodeProperty(key: TNode, value: TNodeProp): void {
        this.nodeProps.set(key, value);
    }

    addNode(node: TNode): void {
        if (!this.nodeProps.has(node)) {
            this.nodeProps.set(node, null);
        }
    }

    setEdgeProperty(edge: TEdge, value: TEdgeProp): void {
        const [sourceNode, targetNode] = edge;
        if (!this.hasNode(sourceNode)) {
            this.addNode(sourceNode);
        }
        if (!this.hasNode(targetNode)) {
            this.addNode(targetNode);
        }

        const neighbor =
            this.edgeProps.get(sourceNode) ?? new Map<TNode, TEdgeProp>();
        neighbor.set(targetNode, value);
        this.edgeProps.set(sourceNode, neighbor);

        const inNeighbor =
            this.reversedEdges.get(targetNode) ?? new Set<TNode>();
        inNeighbor.add(sourceNode);
        this.reversedEdges.set(targetNode, inNeighbor);
    }

    // addEdge(edge: TEdge): void {
    //     const [sourceNode, targetNode] = edge;

    //     const neighbor =
    //         this.edgeProps.get(sourceNode) ?? new Map<TNode, TEdgeProp>();

    //     const inNeighbor =
    //         this.reversedEdges.get(targetNode) ?? new Set<TNode>();

    //     if (!neighbor.has(targetNode)) {
    //         neighbor.set(targetNode, null);
    //     }
    //     this.edgeProps.set(sourceNode, neighbor);

    //     if (!inNeighbor.has(sourceNode)) {
    //         inNeighbor.add(sourceNode);
    //     }

    //     this.reversedEdges.set(targetNode, inNeighbor);

    //     this.addNode(sourceNode);
    //     this.addNode(targetNode);
    // }

    removeEdgeProperty(edge: TEdge): void {
        const [sourceNode, targetNode] = edge;
        this.edgeProps.get(sourceNode)?.delete(targetNode);
        this.reversedEdges.get(targetNode)?.delete(sourceNode);

        if (this.edgeProps.get(sourceNode)?.size === 0) {
            this.edgeProps.delete(sourceNode);
        }

        if (this.reversedEdges.get(targetNode)?.size === 0) {
            this.reversedEdges.delete(targetNode);
        }
    }

    removeNodeProperty(node: TNode): void {
        this.nodeProps.delete(node);
        this.edgeProps.delete(node);
        this.reversedEdges.delete(node);

        for (const sourceNode of this.edgeProps.keys()) {
            const targetNode = node;
            this.edgeProps.get(sourceNode)?.delete(targetNode);
            if (this.edgeProps.get(sourceNode)?.size === 0) {
                this.edgeProps.delete(sourceNode);
            }
        }

        for (const targetNode of this.reversedEdges.keys()) {
            const sourceNode = node;
            this.reversedEdges.get(targetNode)?.delete(sourceNode);
            if (this.reversedEdges.get(targetNode)?.size === 0) {
                this.reversedEdges.delete(targetNode);
            }
        }
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
        const neighbors = this.edgeProps.get(node)?.keys();
        if (neighbors === undefined) {
            return [];
        }

        const fromNode = node;
        return [...neighbors].map((toNode) => [fromNode, toNode]);
    }

    getPredecessorEdgesOf(node: TNode): Array<TEdge> {
        const inNeighbor = this.reversedEdges.get(node)?.keys();
        if (inNeighbor === undefined) {
            return [];
        }

        const toNode = node;
        return [...inNeighbor].map((fromNode) => [fromNode, toNode]);
    }

    getPredecessorsOf(node: TNode): Array<TNode> {
        return this.getPredecessorEdgesOf(node).map(([source, _]) => source);
    }

    getSuccessorsOf(node: TNode): Array<TNode> {
        return this.getSuccessorEdgesOf(node).map(([_, neighbor]) => neighbor);
    }
}
