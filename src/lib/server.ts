import * as BeeQueue from 'bee-queue';
import { Base, Options } from './base';

const handlers: { [ key: string ]: Function } = {};
const services: { [ key: string ]: BeeQueue } = {};

export function Service(name: string, concurrency = 1, settings?: BeeQueue.QueueSettings) {
    return (_constructor: Function) => {
        if (!services[name]) services[name] = new BeeQueue(name, settings);
        services[name].on('ready', () => {
            services[name].process(concurrency, async (job) => {
                if (handlers[job.data._]) return await handlers[job.data._](job);
                else throw new Error('microservice not found');
            });
        });
    };
}

export function Consumer(name: string) {
    return (target: any, key: string) => {
        if (key.startsWith('_')) throw new Error('invalid method');
        else if (typeof target[key] !== 'function')
            throw new Error(`method "${ key }" must be a function`);

        if (!handlers[name]) handlers[name] = target[key];
    };
}

export class Server extends Base {
    constructor(options: Options) {
        super(options);
    }

    async close() {
        for (const name of Object.keys(services)) await services[name].close();
    }

    async destroy() {
        for (const name of Object.keys(services)) await services[name].destroy();
    }
}
