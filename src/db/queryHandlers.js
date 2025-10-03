import * as nodes from './queries/nodesQuery.js';
import * as config from './queries/configQuery.js';
import * as devices from './queries/devicesQuery.js';
import * as metrics from './queries/metricsQuery.js';
import * as diagnostics from './queries/diagnosticsQuery.js';
import * as messages from './queries/messageQuery.js';

const queryHandlers = {
  ...nodes,
  ...config,
  ...devices,
  ...metrics,
  ...messages,
  ...diagnostics
};

export default queryHandlers;
