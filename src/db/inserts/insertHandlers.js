import * as nodes from './nodeInserts.js';
import * as devices from './deviceInserts.js';
import * as metrics from './metricInserts.js';
import * as config from './configInserts.js';
import * as diagnostics from './diagnosticInserts.js';
import * as messages from './messageInsert.js';

const insertHandlers = {
  ...nodes,
  ...devices,
  ...messages,
  ...metrics,
  ...config,
  ...diagnostics
};

export default insertHandlers;
