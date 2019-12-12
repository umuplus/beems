'use strict';

const { Client, Service, Server } = require('../');

class TestService extends Service {
    async test(job) {
        return job.data;
    }

    async throws(job) {
        throw new Error(`Job ID#: ${ job.id }`);
    }

    async delay(job) {
        return new Promise(resolve => {
            setTimeout(() => resolve(job.data), 200);
        });
    }

    async conditionalSuccess(job) {
        if (job.options.retries) throw new Error('custom error');

        return job.data;
    }
}

const prefix = `beems_test_${ Math.floor(Math.random() * 100000) }`;

const client = new Client({ bee: { prefix }, pino: { level: 'debug' } });
const server = new Server({ bee: { prefix }, pino: { level: 'debug' } });

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

test('echo', async done => {
    const r = await client.send('test', 'test', payload);
    expect(r.t).toEqual(payload.t);
    done();
});

test('throw', async done => {
    await expect(client.send('test', 'throws', payload)).rejects.toThrow();
    done();
});

test('conditional success', async done => {
    const r = await client.send('test', 'conditionalSuccess', payload);
    expect(r.t).toEqual(payload.t);
    done();
});

test('delay', async done => {
    await expect(client.send('test', 'delay', payload, { timeout: 100, retries: 2 }))
        .rejects.toThrow();
    done();
});
