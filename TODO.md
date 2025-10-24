## 🛠️ Meshmanager Todo List

### ✅ Message Flow Enhancements
- [ ] Add **Reply** buttons to message cards
  - Capture `messageId`, `fromNodeNum`, `toNodeNum`, and `channelNum`
  - Prefill composer with reply metadata
- [ ] Add hooks to trigger UI updates when new nodes or messages arrive
  - Consider polling or WebSocket integration
- [ ] Query the database for user and node info associated with each message
  - Join `messages`, `users`, and `nodes` tables

### 🧠 Data Integrity & Diagnostics
- [ ] Investigate why some nodes lack associated user info
  - Confirm query logic and fallback behavior
  - Log orphaned node lookups for debugging

### implement SSE on client and server
```js
// hooks/useSSE.js
import { useEffect } from 'react';

export default function useSSE(onEvent) {
  useEffect(() => {
    const source = new EventSource('/sse/events');

    source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      onEvent(data);
    };

    return () => source.close();
  }, [onEvent]);
}
```

Usage:

```js
useSSE((event) => {
  if (event.type === 'packet') {
    setPackets(prev => [...prev, event.packet]);
  }
});
```

### 🎨 UI Polish
- [ ] Add styling to message cards
  - Improve layout, spacing, and hover effects
  - Consider color-coding by channel or node group

### Break appart dispatchRegistry into domains.

1. 🧱 Improve maintainability as packet types grow

2.  📚 Make onboarding easier by isolating logic per domain

3. 🔄 Enable dynamic handler injection or overrides for testing

But holding off for now is wise. The current flat structure keeps everything visible and traceable, which is ideal while you're still refining emit behavior and packet coverage.

```js
// dispatchPacket.js
import { dispatchMessages } from './registrydispatchMessage's;
import { dispatchConfigs } from './registrydispatchConfigs';
import { dispatchTelemetry } from './registrydispatchTelemetry';

export const dispatchRegistry = {
  ...dispatchMessages,
  ...dispatchConfigs,
  ...dispatchTelemetry,
  // etc.
};
export function dispatchPacket(subPacket) {
  if (!subPacket) return;
  
  const handler = dispatchRegistry[subPacket.type];
  if (handler) {
    handler(subPacket);
  } else {
    console.warn(`[dispatchSubPacket] No handler for type ${subPacket.type}`);
  }
}

And each module can export a clean object of handlers:
```

```js
// registry/dispatchMessages.js
export const dispatchMessages = {
  message: (subPacket) => { /* insert + emit */ },
  reply: (subPacket) => { /* insert + emit */ }
};
```