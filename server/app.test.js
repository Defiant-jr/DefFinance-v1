import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

import { createApp } from './app.js';

test('GET /health retorna status ok', async (t) => {
  const { app } = await createApp({ withFrontend: false });
  const server = app.listen(0);
  await once(server, 'listening');

  t.after(() => server.close());

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload, { status: 'ok' });
});
