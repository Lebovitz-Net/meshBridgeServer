// src/bridge/events/eventEmitter.js

/**
 * EventEmitter for lifecycle + system events.
 * Used by dispatchRegistry to signal things like configComplete, messageReceived, etc.
 */

const listeners = new Map();

/**
 * Subscribe to a named event.
 * @param {string} eventType
 * @param {Function} fn
 */
export function onEvent(eventType, fn) {
  if (!listeners.has(eventType)) listeners.set(eventType, new Set());
  listeners.get(eventType).add(fn);
  return () => listeners.get(eventType).delete(fn); // unsubscribe
}

/**
 * Emit an event to all subscribers.
 * @param {string} eventType
 * @param {Object} payload
 */
export function emitEvent(eventType, payload) {
  const subs = listeners.get(eventType);
  if (!subs) return;
  for (const fn of subs) {
    try {
      fn(payload);
    } catch (err) {
      console.error(`[eventEmitter] Listener for ${eventType} failed:`, err);
    }
  }
}

/**
 * Utility: log all events to console (for dev/debug).
 */
export function enableConsoleEventLogger() {
  onEvent('*', (payload) => {
    console.debug('[eventEmitter]', payload);
  });
}
