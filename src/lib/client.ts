import * as BeeQueue from 'bee-queue';
import { Base, Options } from './base';

const services: { [ key: string ]: BeeQueue } = {};

export interface Data {
    [key: string]: any;
}

export interface JobOptions {
    setId?: string;
    retries?: number;
    backoff?: [ 'immediate' | 'fixed' | 'exponential', number ];
    delayUntil?: Date;
    timeout?: number;
}

export class Client extends Base {
    constructor(options: Options) {
        super(options);
    }

    acceptServices(list: string[], options?: BeeQueue.QueueSettings) {
        if (!(list instanceof Array)) throw new Error('list must be an array of service names');

        for (const service of list) this.acceptService(service, options);
    }

    acceptService(service: string, options?: BeeQueue.QueueSettings) {
        if (!options) options = this.options.bee;
        if (!services[service]) services[service] = new BeeQueue(service, options);
    }

    async forward(service: string, method: string, data: Data, options?: JobOptions):
        Promise<any> {
        data._ = `${service}.${method}`;
        const job = services[service].createJob(data);
        if (options) {
            if (options.backoff) job.backoff(...options.backoff);
            if (options.delayUntil) job.delayUntil(options.delayUntil);
            if (options.retries) job.retries(options.retries);
            if (options.setId) job.setId(options.setId);
            if (options.timeout) job.timeout(options.timeout);
        }
        await job.save();
        this.logger.info(`${ service }|${ method }|C|${ JSON.stringify(data) }`);
        return job;
    }

    async send(service: string, method: string, data: Data, options?: JobOptions):
        Promise<any> {
        const job = await this.forward(service, method, data, options);
        return new Promise((resolve, reject) => {
            job.on('succeeded', resolve);
            job.on('failed', reject);
        });
    }

    async close() {
        for (const name of Object.keys(services)) await services[name].close();
    }
}
