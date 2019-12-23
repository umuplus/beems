# beems

a bee-queue based minimalist toolkit for building fast, decentralized, scalable and fault tolerant microservices

Before running tests, please make sure that you have Redis available on localhost.
If you don't know how to do that temporarily, please use following command to run it via docker.

```bash
docker run -p 6379:6379 --name beems_redis redis:4-alpine
```

## Configuration

- **bee:** options for initializing a bee queue instance. please see more details at [Bee Queue Settings](https://github.com/bee-queue/bee-queue#settings).
- **job:** options for creating a bee queue job. only setId, retries, backoff, delayUntil and timeout methods allowed.
    please see more details at [Bee Queue Job Settings](https://github.com/bee-queue/bee-queue#methods-1).
- **pino:** options for pino logger. it's { "level": "error" } by default.

## Decorators

- **Service(name, concurrency, settings)** adds a new service and automatically creates related queue and its consumer
- **Consumer(name):** registers a consumer method to an existing service

## Server Methods

- **.close():** stops all existing queues for a clean shutdown
- **.destroy():** removes everything about existing queues from redis

## Client Methods

- **.acceptServices(list, options):** accepts existing services to send jobs
- **.acceptService(service, options):** accepts an existing service to send jobs
- **.forward(service, method, data, options):** sends a new job to an existing service
- **.send(service, method, data, options):** sends a new job to an existing service and retrieves its response
- **.close():** stops all existing queues for a clean shutdown

## Examples

```js
const { Client, Consumer, Service, Server } = require('beems');
const { cpus } = require('os');

@Service('test', cpus().length)
class TestService {
    @Consumer('test.echo')
    static async echo(job: Job) {
        return job.data;
    }
}

const client = new Client();
const server = new Server();
client.acceptServices([ 'test' ]);

const r = await client.send('test', 'echo', { t: Date.now() })
console.log(r);

await client.close();
await server.destroy();
await server.close();
```

## Optional Job Configuration

please see more details at [Bee Queue Job Settings](https://github.com/bee-queue/bee-queue#methods-1).

```js
await client.send('test', 'echo', { t: Date.now() }, {
    setId: 'my-custom-job-id',
    retries: 2,
    backoff: [ 'fixed', 1000 ],
    delayUntil: Date.parse('2082-08-23T00:00:01.000Z'),
    timeout: 10000
});
```
