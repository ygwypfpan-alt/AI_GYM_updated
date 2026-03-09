import 'dotenv/config';

import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.apiPort, () => {
  console.log(`AI GYM API listening on http://localhost:${config.apiPort}`);
});
