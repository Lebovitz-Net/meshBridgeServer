import * as nodes from './inserts/nodeInserts.js';
import * as devices from './inserts/deviceInserts.js';
import * as metrics from './inserts/metricInserts.js';
import * as config from './inserts/configInserts.js';
import * as diagnostics from './inserts/diagnosticInserts.js';
import * as messages from './inserts/messageInserts.js';
import * as channels from './inserts/channelInserts.js';

export const insertHandlers = {
  ...nodes,
  ...devices,
  ...messages,
  ...metrics,
  ...config,
  ...channels,
  ...diagnostics
};
