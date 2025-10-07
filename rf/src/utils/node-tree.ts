import { AppNode } from '../nodes/types';

/**
 * Filters the provided nodes to find the direct children of a given parent node.
 *
 * @param parentId The ID of the parent node. If undefined, it returns root nodes.
 * @param allNodes The array of all nodes to search within.
 * @returns An array of child nodes.
 */
export const getChildren = (parentId: string | undefined, allNodes: AppNode[]): AppNode[] => {
  return allNodes.filter((node) => (node.data.parentId || undefined) === parentId);
};

/**
 * Finds the root nodes (nodes without a parentId) in a given array of nodes.
 *
 * @param allNodes The array of all nodes to search within.
 * @returns An array of root nodes.
 */
export const getRootNodes = (allNodes: AppNode[]): AppNode[] => {
  return allNodes.filter((node) => !node.data.parentId);
};

/**
 * Finds a single node by its ID.
 *
 * @param nodeId The ID of the node to find.
 * @param allNodes The array of all nodes to search within.
 * @returns The found node, or undefined if not found.
 */
export const getNodeById = (nodeId: string, allNodes: AppNode[]): AppNode | undefined => {
  return allNodes.find((node) => node.id === nodeId);
};