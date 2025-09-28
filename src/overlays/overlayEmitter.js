// src/bridge/overlays/overlayEmitter.js

/**
 * OverlayEmitter is a simple pub/sub for diagnostic overlays.
 * It lets the ingestion pipeline broadcast events (message, position, telemetry, etc.)
 * to any listeners (UI, logs, metrics dashboards).
 */

const listeners = new Set();

/**
 * Subscribe to overlay events.
 * @param {Function} fn - callback (eventType, payload)
 */
export function subscribeOverlay(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn); // unsubscribe function
}

/**
 * Emit an overlay event to all subscribers.
 * @param {string} eventType - e.g. 'message', 'position', 'telemetry'
 * @param {Object} payload - normalized subPacket
 */
export function emitOverlay(eventType, payload) {
  for (const fn of listeners) {
    try {
      fn(eventType, payload);
    } catch (err) {
      console.error('[overlayEmitter] Listener error:', err);
    }
  }
}

/**
 * Utility: log overlays to console (for dev/debug).
 */
export function enableConsoleOverlayLogger() {
  subscribeOverlay((eventType, payload) => {
    console.debug(`[overlayEmitter] ${eventType}`, {
      from: payload.fromNodeNum,
      to: payload.toNodeNum,
      device: payload.device_id,
      data: payload.data,
      meta: payload.meta,
    });
  });
}
