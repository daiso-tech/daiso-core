/**
 * @module DI
 */
import { tokenToString } from "@/di/implementations/eager/utils.js";
import { UnexpectedError } from "@/utilities/_module.js";

import type { Node, Edge } from "@/di/implementations/eager/_shared.js";

/**
 * @internal
 */
const edgeToString = (edge: Edge): string =>
    `[${tokenToString(edge[0])}, ${tokenToString(edge[1])}]`;

/**
 * A directed graph that stores arbitrary properties on its nodes and edges.
 * @internal
 */
export class Graph<TNodeProp = unknown, TEdgeProp = unknown> {
    private nodeProps = new Map<Node, TNodeProp | null>();
    private edgeProps = new Map<Node, Map<Node, TEdgeProp | null>>();
    private reversedEdges = new Map<Node, Set<Node>>();

    constructor(args?: {
        nodeProps?: Array<[Node, TNodeProp | null]>;
        edgeProps?: Array<[Edge, TEdgeProp | null]>;
    }) {
        const nodeProps = args?.nodeProps;
        const edgeProps = args?.edgeProps;

        if (nodeProps !== undefined) {
            this.throwIfDuplicateNodesFound(nodeProps);

            for (const [node, property] of nodeProps) {
                if (property === null) {
                    this.addNode(node);
                } else {
                    this.setNodeProperty(node, property);
                }
            }
        }

        if (edgeProps !== undefined) {
            this.throwIfDuplicateEdgeFound(edgeProps);

            for (const [edge, property] of edgeProps) {
                if (property === null) {
                    this.addEdge(edge);
                } else {
                    this.setEdgeProperty(edge, property);
                }
            }
        }
    }
    /**
     * Creates a deep copy of this graph, including all of its nodes and edges.
     *
     * @returns A new {@link Graph} instance with the same nodes, edges, and properties.
     */
    copy(): Graph<TNodeProp, TEdgeProp> {
        const nodeProps = this.nodes().map(
            (node) =>
                [node, this.getNodeProperty(node)] satisfies [
                    Node,
                    TNodeProp | null,
                ],
        );
        const edgeProps = this.edges().map(
            (edge) =>
                [edge, this.getEdgeProperty(edge)] satisfies [
                    Edge,
                    TEdgeProp | null,
                ],
        );

        return new Graph({ edgeProps, nodeProps });
    }

    private throwIfDuplicateNodesFound(props: Array<[Node, TNodeProp | null]>) {
        const nodeSet = new Set<Node>();
        const duplicates: Array<Node> = [];

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

    private throwIfDuplicateEdgeFound(props: Array<[Edge, TEdgeProp | null]>) {
        const edgesMap = new Map<Node, Set<Node>>();
        const duplicates: Array<Edge> = [];

        for (const [[sourceNode, targetNode], _] of props) {
            const edgeExist =
                edgesMap.get(sourceNode)?.has(targetNode) === true;

            if (edgeExist) {
                duplicates.push([sourceNode, targetNode]);
            }

            const neighbors = edgesMap.get(sourceNode) ?? new Set<Node>();
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

    hasNodeProperty(node: Node): boolean {
        return this.getNodeProperty(node) !== null;
    }

    hasEdgeProperty(edge: Edge): boolean {
        return this.getEdgeProperty(edge) !== null;
    }

    hasNode(node: Node): boolean {
        return this.nodeProps.has(node);
    }

    hasEdge(edge: Edge): boolean {
        const [sourceNode, targetNode] = edge;
        return this.edgeProps.get(sourceNode)?.has(targetNode) ?? false;
    }

    getNodeProperty(nodeId: Node): TNodeProp | null {
        return this.nodeProps.get(nodeId) ?? null;
    }

    getEdgeProperty(edge: Edge): TEdgeProp | null {
        const [sourceNode, targetNode] = edge;
        return this.edgeProps.get(sourceNode)?.get(targetNode) ?? null;
    }

    getNodePropertyOrThrow(key: Node): TNodeProp {
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

    getEdgePropertyOrThrow(edge: Edge): TEdgeProp {
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

    setNodeProperty(key: Node, value: TNodeProp): void {
        this.nodeProps.set(key, value);
    }

    addNode(node: Node): void {
        if (!this.nodeProps.has(node)) {
            this.nodeProps.set(node, null);
        }
    }

    setEdgeProperty(edge: Edge, value: TEdgeProp): void {
        const [sourceNode, targetNode] = edge;
        if (!this.hasNode(sourceNode)) {
            this.addNode(sourceNode);
        }
        if (!this.hasNode(targetNode)) {
            this.addNode(targetNode);
        }

        const neighbor =
            this.edgeProps.get(sourceNode) ?? new Map<Node, TEdgeProp>();
        neighbor.set(targetNode, value);
        this.edgeProps.set(sourceNode, neighbor);

        const inNeighbor =
            this.reversedEdges.get(targetNode) ?? new Set<Node>();
        inNeighbor.add(sourceNode);
        this.reversedEdges.set(targetNode, inNeighbor);
    }

    addEdge(edge: Edge): void {
        const [sourceNode, targetNode] = edge;

        const neighbor =
            this.edgeProps.get(sourceNode) ?? new Map<Node, TEdgeProp>();

        const inNeighbor =
            this.reversedEdges.get(targetNode) ?? new Set<Node>();

        if (!neighbor.has(targetNode)) {
            neighbor.set(targetNode, null);
        }
        this.edgeProps.set(sourceNode, neighbor);

        if (!inNeighbor.has(sourceNode)) {
            inNeighbor.add(sourceNode);
        }

        this.reversedEdges.set(targetNode, inNeighbor);

        this.addNode(sourceNode);
        this.addNode(targetNode);
    }

    removeEdge(edge: Edge): void {
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

    removeNode(node: Node): void {
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

    nodes(): Array<Node> {
        return [...this.nodeProps.keys()];
    }

    edges(): Array<Edge> {
        return [...this.edgeProps.entries()].flatMap(([node, neighborsMap]) =>
            [...neighborsMap.keys()].map(
                (neighborNode) => [node, neighborNode] satisfies Edge,
            ),
        );
    }

    getSuccessorEdgesOf(node: Node): Array<Edge> {
        const neighbors = this.edgeProps.get(node)?.keys();
        if (neighbors === undefined) {
            return [];
        }

        const fromNode = node;
        return [...neighbors].map((toNode) => [fromNode, toNode]);
    }

    getPredecessorEdgesOf(node: Node): Array<Edge> {
        const inNeighbor = this.reversedEdges.get(node)?.keys();
        if (inNeighbor === undefined) {
            return [];
        }

        const toNode = node;
        return [...inNeighbor].map((fromNode) => [fromNode, toNode]);
    }

    getPredecessorsOf(node: Node): Array<Node> {
        return this.getPredecessorEdgesOf(node).map(([source, _]) => source);
    }

    getSuccessorsOf(node: Node): Array<Node> {
        return this.getSuccessorEdgesOf(node).map(([_, neighbor]) => neighbor);
    }
}
