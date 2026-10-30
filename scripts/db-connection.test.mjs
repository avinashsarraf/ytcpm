import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectWithRetry } from './db-connection.mjs';
test('returns a connected client on the first attempt', async () => {
  const client = { connect: async () => {}, end: async () => {} };
  assert.equal(await connectWithRetry(() => client), client);
});
test('creates a fresh client and cleans up every failed attempt', async () => {
  let created = 0; const ended = []; const warnings = [];
  const client = await connectWithRetry(() => {
    const index = ++created;
    return { index, connect: async () => { if (index < 3) throw new Error('unavailable'); }, end: async () => { ended.push(index); } };
  }, { attempts: 3, retryMs: 0, warn: message => warnings.push(message) });
  assert.equal(client.index, 3); assert.deepEqual(ended, [1, 2]); assert.equal(warnings.length, 2);
});
test('rejects after the maximum and preserves the original failure', async () => {
  const failure = new Error('connection failed'); let created = 0; let ended = 0;
  await assert.rejects(connectWithRetry(() => { created++; return { connect: async () => { throw failure; }, end: async () => { ended++; } }; }, { attempts: 2, retryMs: 0, warn: () => {} }), error => error === failure);
  assert.equal(created, 2); assert.equal(ended, 2);
});
test('cleanup errors do not mask the connection failure', async () => {
  const failure = new Error('offline');
  await assert.rejects(connectWithRetry(() => ({ connect: async () => { throw failure; }, end: async () => { throw new Error('closed'); } }), { attempts: 1, warn: () => {} }), error => error === failure);
});
test('does not put driver credentials into retry logs', async () => {
  const warnings = [];
  await assert.rejects(connectWithRetry(() => ({ connect: async () => { throw new Error('postgres://user:secret@host/db'); }, end: async () => {} }), { attempts: 1, warn: message => warnings.push(message) }));
  assert(!warnings.join('').includes('secret'));
});
for (const options of [{ attempts: 0 }, { attempts: NaN }, { attempts: 1.5 }, { attempts: 21 }, { retryMs: -1 }, { retryMs: Infinity }]) {
  test(`rejects invalid retry settings ${JSON.stringify(options)}`, async () => {
    await assert.rejects(connectWithRetry(() => { throw new Error('must not create a client'); }, options), /Invalid migration retry/);
  });
}
