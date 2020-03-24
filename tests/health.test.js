'use strict';

const { Client, Service, Server } = require('../');

class TestService extends Service {
  // * returns same data back
  async test(job) {
    return job.data;
  }

  // * throws an error directly
  async throws(job) {
    throw new Error(`Job ID#: ${ job.id }`);
  }

  // * returns same data back after waiting for a short time
  async delay(job) {
    job.reportProgress(50);
    return new Promise(resolve => {
      setTimeout(() => {
        job.reportProgress(100);
        setTimeout(() => {
          resolve(job.data);
        }, 100);
      }, 100);
    });
  }

  // * returns same data back after a few retries
  async conditionalSuccess(job) {
    if (job.options.retries) throw new Error('custom error');

    return job.data;
  }
}

const prefix = `beems_test_${ Math.floor(Math.random() * 100000) }`;
const client = new Client({ bee: { prefix }, pino: { level: 'debug' } });
const server = new Server({
  bee: { prefix },
  on: { failed: (j, e) => server.logger.error(j.id, e.message) },
  pino: { level: 'debug' }
});

beforeAll(async done => {
  server.addServices([ new TestService('test') ]);
  client.acceptServices([ 'test' ]);
  setTimeout(() => done(), 750);
});
afterAll(async done => {
  await client.close();
  await server.destroy();
  await server.close();
  setTimeout(() => done(), 750);
});

const payload = { t: Date.now() };

test('invalid service attempt', async () => {
  await expect(server.addService()).rejects.toThrow();
});

test('echo', async () => {
  const { response } = await client.send('test', 'test', payload);
  expect(response.t).toEqual(payload.t);
});

test('throw', async () => {
  try {
    await client.send('test', 'throws', payload);
    expect(false).toBeTruthy();
  } catch ({ error }) {
    expect(Promise.reject(error)).rejects.toThrow();
  }
});

test('conditional success', async () => {
  const { response } = await client.send('test', 'conditionalSuccess', payload);
  expect(response.t).toEqual(payload.t);
});

test('conditional success', async () => {
  const counts = await client.health('test');
  expect(counts.newestJob).toBeTruthy();
});

test('delay', async () => {
  try {
    await client.send('test', 'delay', payload, { timeout: 100, retries: 2 });
    expect(false).toBeTruthy();
  } catch ({ error }) {
    expect(Promise.reject(error)).rejects.toThrow();
  }
});
