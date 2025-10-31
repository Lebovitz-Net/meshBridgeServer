// MeshCore/sessionManager.js

const subscriptions = new Map(); // key: nodeId, value: Set of opcodes
const nodeState = new Map();     // key: nodeId, value: { config, lastSeen, metadata }

/**
 * Subscribe a node to a specific opcode or topic.
 * @param {string} nodeId
 * @param {string} opcode
 */
export function subscribe(nodeId, opcode) {
  if (!subscriptions.has(nodeId)) {
    subscriptions.set(nodeId, new Set());
  }
  subscriptions.get(nodeId).add(opcode);
}

/**
 * Unsubscribe a node from a specific opcode or topic.
 * @param {string} nodeId
 * @param {string} opcode
 */
export function unsubscribe(nodeId, opcode) {
  if (subscriptions.has(nodeId)) {
    subscriptions.get(nodeId).delete(opcode);
    if (subscriptions.get(nodeId).size === 0) {
      subscriptions.delete(nodeId);
    }
  }
}

/**
 * Get all subscriptions for a node.
 * @param {string} nodeId
 * @returns {Set<string>}
 */
export function getSubscriptions(nodeId) {
  return subscriptions.get(nodeId) || new Set();
}

/**
 * Update or cache node state (e.g., config, metadata).
 * @param {string} nodeId
 * @param {object} updates - { config?, lastSeen?, metadata? }
 */
export function updateNodeState(nodeId, updates = {}) {
  const current = nodeState.get(nodeId) || {};
  nodeState.set(nodeId, { ...current, ...updates });
}

/**
 * Get current state for a node.
 * @param {string} nodeId
 * @returns {object}
 */
export function getNodeState(nodeId) {
  return nodeState.get(nodeId) || {};
}

/**
 * Clear all session state (e.g., on disconnect).
 */
export function reset() {
  subscriptions.clear();
  nodeState.clear();
}

/**
 * Optional: MeshGateway compatibility hook.
 * MeshCore doesn't require node mapping, so this is a no-op.
 * @returns {Promise<void>}
 */
export async function waitForMapping() {
  return Promise.resolve(); // No mapping needed for MeshCore
}
