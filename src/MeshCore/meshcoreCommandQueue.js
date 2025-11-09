export class MeshcoreCommandQueue {
  queue = [];
  waiting = null;
  isProcessing = false;
  loops = new Map();

  constructor(meshcore, timeoutMs = 5000) {
    this.timeoutMs = timeoutMs;
    this.meshcore = meshcore;

    meshcore.on('ok', () => {
      if (this.waiting) {
        this.waiting('ok');
        this.waiting = null;
      }
    });

    meshcore.on('err', () => {
      if (this.waiting) {
        this.waiting('err');
        this.waiting = null;
      }
    });

  }

  send(commandFn) {
    return new Promise((resolve) => {
      const task = () => {
        const startTime = Date.now();
        console.log(`[MeshcoreQueue] Dispatching command at ${new Date(startTime).toISOString()}`);

        const timer = setTimeout(() => {
          this.waiting = null;
          console.warn(`[MeshcoreQueue] Command timed out after ${this.timeoutMs}ms`);
          resolve('timeout');
          this.processNext();
        }, this.timeoutMs);

        this.waiting = (status) => {
          clearTimeout(timer);
          const duration = Date.now() - startTime;
          console.log(`[MeshcoreQueue] Command result: ${status} (${duration}ms)`);
          resolve(status === 'ok' ? 'ok' : 'failed');
          this.processNext();
        };

        try {
          commandFn();
        } catch (err) {
          clearTimeout(timer);
          this.waiting = null;
          console.error(`[MeshcoreQueue] Command dispatch error: ${err.message}`);
          resolve('error');
          this.processNext();
        }
      };

      this.queue.push(task);
      if (!this.isProcessing && !this.waiting) {
        this.processNext();
      }
    });
  }


  processNext() {
    const next = this.queue.shift();
    if (next) {
      this.isProcessing = true;
      next();
    } else {
      this.isProcessing = false;
    }
  }

  flush() {
    console.warn('[MeshcoreQueue] Flushing queue — cancelling all pending commands');
    this.queue = [];
    this.waiting = null;
    this.isProcessing = false;
  }

  isIdle() {
    return this.queue.length === 0 && !this.waiting;
  }

  startLoop(label, commandFn, intervalMs = 3600000) {
    if (this.loops.has(label)) {
      console.warn(`[MeshcoreQueue] Loop "${label}" already running`);
      return this.loops.get(label);
    }

    let isRunning = false;

    const loopFn = async () => {
      if (isRunning) return;
      isRunning = true;

      const result = await this.send(commandFn);
      switch (result) {
        case 'ok':
          console.log(`[MeshcoreQueue] Loop "${label}" command succeeded`);
          break;
        case 'failed':
          console.warn(`[MeshcoreQueue] Loop "${label}" command returned 'failed'`);
          break;
        case 'timeout':
          console.warn(`[MeshcoreQueue] Loop "${label}" command timed out`);
          break;
        case 'error':
          console.error(`[MeshcoreQueue] Loop "${label}" command threw an error`);
          break;
        default:
          console.warn(`[MeshcoreQueue] Loop "${label}" returned unknown status: ${result}`);
      }

      isRunning = false;
    };

    loopFn(); // run immediately
    const interval = setInterval(loopFn, intervalMs);
    this.loops.set(label, interval);
    return interval;
  }


  stopLoop(label) {
    const interval = this.loops.get(label);
    if (interval) {
      clearInterval(interval);
      this.loops.delete(label);
      console.log(`[MeshcoreQueue] Loop "${label}" stopped`);
    }
  }

  awaitConnected(timeoutMs = 5000) {
    const emitter = this.meshcore;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        emitter.off('connected', onConnected);
        reject(new Error(`connected timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      function onConnected(info) {
        clearTimeout(timer);
        emitter.off('connected', onConnected);
        resolve(info);
      }

      emitter.on('connected', onConnected);
      emitter.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
