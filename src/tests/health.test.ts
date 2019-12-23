import { Job } from 'bee-queue';
import { Client, Consumer, Server, Service } from '..';

const prefix = `beems_test_${ Math.floor(Math.random() * 100000) }`;
const client = new Client({ bee: { prefix }, pino: { level: 'debug' } });
const server = new Server({ pino: { level: 'debug' } });

@Service('test', 1, { prefix })
class TestService {
    @Consumer('test.echo')
    static async echo(job: Job) {
        return job.data;
    }

    @Consumer('test.throws')
    static async throws(job: Job) {
        throw new Error(`Job ID#: ${ job.id }`);
    }

    @Consumer('test.delay')
    static async delay(job: Job) {
        job.reportProgress(50);
        return new Promise((resolve) => {
            setTimeout(() => {
                job.reportProgress(100);
                setTimeout(() => {
                    resolve(job.data);
                }, 100);
            }, 100);
        });
    }

    @Consumer('test.conditionalSuccess')
    static async conditionalSuccess(job: Job) {
        if (job.options.retries) throw new Error('custom error');

        return job.data;
    }
}

beforeAll(async (done) => {
    client.acceptServices([ 'test' ]);
    setTimeout(() => done(), 750);
});
afterAll(async (done) => {
    await client.close();
    await server.destroy();
    await server.close();
    setTimeout(() => done(), 250);
});

const payload = { t: Date.now() };

test('echo', async (done) => {
    const r = await client.send('test', 'echo', payload);
    expect(r.t).toEqual(payload.t);
    done();
});

test('throw', async (done) => {
    await expect(client.send('test', 'throws', payload)).rejects.toThrow();
    done();
});

test('conditional success', async (done) => {
    const r = await client.send('test', 'conditionalSuccess', payload, { retries: 2 });
    expect(r.t).toEqual(payload.t);
    done();
});

test('delay', async (done) => {
    await expect(client.send('test', 'delay', payload, { timeout: 100 }))
        .rejects.toThrow();
    done();
});
