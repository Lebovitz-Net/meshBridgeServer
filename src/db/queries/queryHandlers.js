import * as nodes from './nodesQuery.js';
import * as config from './configQuery.js';
import * as devices from './devicesQuery.js';
import * as metrics from './metricsQuery.js';
import * as diagnostics from './diagnosticsQuery.js';
import * as messages from './messageQuery.js';

const queryHandlers = {
  ...nodes,
  ...config,
  ...devices,
  ...metrics,
  ...messages,
  ...diagnostics
};

export default queryHandlers;
