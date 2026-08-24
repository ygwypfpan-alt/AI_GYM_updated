import 'dotenv/config';

import { createApp } from './app.js';
import { config } from './config.js';
import { logStartup } from './lib/logger.js';

const app = createApp();

app.listen(config.apiPort, () => {
  logStartup(`API listening on http://localhost:${config.apiPort}`);
});
