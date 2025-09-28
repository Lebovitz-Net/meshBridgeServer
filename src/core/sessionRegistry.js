let activeSessions = new Map();

/**
 * Replace the entire session map (used for testing or hot reload).
 * @param {Map} sessions - Map of sessionId -> { ws, meta }
 */
export const setActiveSessions = (sessions) => {
  if (!(sessions instanceof Map)) {
    throw new Error('setActiveSessions expects a Map of sessionId -> { ws, meta }');
  }
  activeSessions = sessions;
};

/**
 * Returns the full session map.
 * @returns {Map}
 */
export const getActiveSessions = () => activeSessions;

/**
 * Retrieves a session by ID.
 * @param {string} id
 * @returns {object|null}
 */
export const getSessionById = (id) => activeSessions.get(id) || null;

/**
 * Registers a new session.
 * @param {string} sessionId
 * @param {object} sessionData - { ws, meta }
 */
export const registerSession = (sessionId, sessionData) => {
  if (!sessionData || typeof sessionData !== 'object') {
    throw new Error('registerSession expects an object with { ws, meta }');
  }

  activeSessions.set(sessionId, {
    ...sessionData,
    registeredAt: Date.now()
  });
};

/**
 * Unregisters a session and optionally emits diagnostics.
 * @param {string} sessionId
 */
export const unregisterSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  activeSessions.delete(sessionId);

  // Optional: emit diagnostic event
  if (session.meta?.nodeId) {
    import('./diagnostics.js').then(({ emitDiagnostic }) => {
      emitDiagnostic('session_closed', {
        sessionId,
        nodeId: session.meta.nodeId,
        transport: session.meta.transport,
        durationMs: Date.now() - (session.registeredAt || 0)
      });
    });
  }
};
