import * as nodes from './nodes.js';
import * as messages from './messages.js';
import * as metrics from './metrics.js';
import * as devices from './devices.js';
import * as system from './system.js';
import * as diagnostics from './diagnostics.js';
import * as control from './control.js';
import * as config  from './config.js';

const apiHandlers = {
  ...nodes,
  ...messages,
  ...metrics,
  ...devices,
  ...system,
  ...diagnostics,
  ...control,
  ...config,
};

export default apiHandlers;
