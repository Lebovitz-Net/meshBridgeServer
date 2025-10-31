// Meshtastic/routing/sessionManager.js

import { waitForMapping as internalWaitForMapping } from './nodeMapping.js';

const subscriptions = new Map(); // key: nodeId, value: Set of topics
const nodeState = new Map();     // key: nodeId, value: { config, lastSeen, metadata }

/**
 * Protocol-specific handshake hook for meshGateway.
 * Waits for node mapping to complete after WANT_CONFIG.
 * @param {string} host
 * @param {object} options - { timeout: number }
 */
export async function waitForMapping(host, { timeout = 5000 } = {}) {
  console.log(`[Meshtastic] Waiting for node mapping: ${host} (${timeout}ms)`);
  try {
    return await internalWaitForMapping(host, { timeout });
  } catch (err) {
    console.warn(`[Meshtastic] Mapping timeout or failure:`, err);
    return null;
  }
}

/**
 * Subscribe a node to a specific topic or opcode.
 * @param {string} nodeId
 * @param {string} topic
 */
export function subscribe(nodeId, topic) {
  if (!subscriptions.has(nodeId)) {
    subscriptions.set(nodeId, new Set());
  }
  subscriptions.get(nodeId).add(topic);
}

/**
 * Unsubscribe a node from a topic.
 * @param {string} nodeId
 * @param {string} topic
 */
export function unsubscribe(nodeId, topic) {
  if (subscriptions.has(nodeId)) {
    subscriptions.get(nodeId).delete(topic);
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
