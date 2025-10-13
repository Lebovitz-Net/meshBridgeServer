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
