# 🧪 Contributor Testing Checklist

This guide explains how to extend the ingestion pipeline tests when adding new packet subtypes or modifying schema/dispatch logic. Follow this checklist to keep the system **protocol‑faithful, dry‑run safe, and contributor‑friendly**.

---

## ✅ Steps for Adding a New Subtype

1. **Update Protobuf Schema**
   - Add the new subtype definition in `proto.json`.
   - Confirm it is decoded correctly by `decodeAndNormalize()`.

2. **Extend Schema Validator**
   - In `schemaValidator.js`, add a new entry in `schemaDefinitions`.
   - Define required fields and optional type checks.

3. **Add Dispatch Handler**
   - In `dispatchRegistry.js`, add a new handler function for the subtype.
   - Ensure it calls the correct `insertHandlers` function(s).
   - Optionally emit overlays (`emitOverlay`) or events (`emitEvent`).

4. **Create Fixture**
   - In `test/fixtures/packets.js`, add a canonical encoded buffer for the subtype.
   - Provide a minimal `expected` decoded object for clarity.

5. **Write Unit Tests**
   - In `schemaValidator.test.js`, add tests for valid and invalid cases of the new subtype.
   - Ensure missing required fields are caught.

6. **Write Integration Tests**
   - In `ingestionPipeline.test.js`, add tests that run the decoded object through:
     - `normalizeDecodedPacket()`
     - `validateSubPacket()`
     - `dispatchSubPacket()`
   - Assert that the correct DB inserts, overlays, and events are triggered.

7. **Write End‑to‑End Tests**
   - In `ingestion.e2e.test.js`, use the raw buffer fixture.
   - Run it through the full pipeline (`decodeAndNormalize → normalizeDecodedPacket → validateSubPacket → dispatchSubPacket`).
   - Assert side effects (DB, overlays, events).

8. **Use Test Helper**
   - In `decodeFixture.js`, add a one‑liner test using `decodeFixture('yourSubtype', meta, true)`.
   - This ensures consistency across tests.

---

## 📘 Contributor Notes

- **Dry‑Run Safety**: All handlers must log and skip gracefully if required fields are missing.
- **Canonical Fixtures**: Fixtures are the single source of truth for encoded test data.
- **Traceability**: Always assert both DB calls and overlay/event emissions.
- **Extensibility**: Adding a new subtype should never require editing core router logic—only schema, registry, and tests.

---

By following this checklist, every new subtype is fully covered from **schema → dispatch → DB/overlay/event → tests**, ensuring the ingestion pipeline remains robust, modular, and teachable.
