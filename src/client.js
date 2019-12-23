'use strict';

const Base = require('./base');
const is = require('is_js');
const Queue = require('bee-queue');

const jobOptions = [ 'setId', 'retries', 'backoff', 'delayUntil', 'timeout' ];

class Client extends Base {
    /**
     *Creates an instance of Client.
     * @param {Object} [options] options
     * @memberof Client
     */
    constructor(options) {
        super(options);

        if (is.not.object(this.options.bee) || is.array(this.options.bee))
            this.options.bee = {};
        this.options.bee.isWorker = false;
    }

    /**
     * @description accepts existing services to send jobs
     * @param {Array} services list of services to be accepted
     * @param {Object} [options] options
     * @throws Error
     * @memberof Client
     */
    acceptServices(services, options) {
        if (is.not.array(services)) throw new Error('invalid services');

        for (const service of services) this.acceptService(service, options);
    }

    /**
     * @description accepts an existing service to send jobs
     * @param {String} service name of service to be accepted
     * @param {Object} [options] options
     * @see https://github.com/bee-queue/bee-queue#settings
     * @throws Error
     * @memberof Client
     */
    acceptService(service, options) {
        if (is.not.object(options) || is.array(options)) options = this.options.bee;
        if (is.not.string(service) || is.empty(service))
            throw new Error('invalid service');
        else if (is.not.object(options)) throw new Error('invalid options');

        if (is.not.existy(this.services[service])) {
            this.services[service] = new Queue(service, options);
            this.logger.info(`${ service }|ready(C)`);
        } else this.logger.warn(`${ service }|exists`);
    }

    /**
     * @description sends a new job to an existing service
     * @param {String} service name of an existing service
     * @param {String} method name of an existing method in an existing service
     * @param {Object} data payload
     * @param {Object} [options] options for creating a job
     * @see https://github.com/bee-queue/bee-queue#methods-1
     * @returns Promise
     * @memberof Client
     */
    async forward(service, method, data, options) {
        if (is.not.object(options) || is.array(options)) options = this.options.job || {};
        if (is.not.string(service) || is.empty(service)) throw new Error('invalid service');
        else if (is.not.string(method) || is.empty(method)) throw new Error('invalid method');
        else if (is.not.object(data) || is.array(data)) throw new Error('invalid data');
        else if (is.not.object(options) || is.array(options))
            throw new Error('invalid options');

        data._ = method;
        const job = this.services[service].createJob(data);
        for (let config in options)
            if (jobOptions.includes(config) && is.function(job[config]))
                if (is.array(options[config])) job[config](...options[config]);
                else job[config](options[config]);
        await job.save();
        this.logger.info(`${ service }|${ method }|C|${ JSON.stringify(data) }`);
        return job;
    }

    /**
     * @description sends a new job to an existing service and retrieves its response
     * @param {String} service name of an existing service
     * @param {String} method name of an existing method in an existing service
     * @param {Object} data payload
     * @param {Object} [options] options for creating a job
     * @see https://github.com/bee-queue/bee-queue#methods-1
     * @returns Promise
     * @memberof Client
     */
    async send(service, method, data, options) {
        const job = await this.forward(service, method, data, options);
        return new Promise((resolve, reject) => {
            job.on('succeeded', resolve);
            job.on('failed', reject);
        });
    }

    /**
     * @description stops all existing queues for a clean shutdown
     * @returns Promise
     * @memberof Client
     */
    async close() {
        for (const name of Object.keys(this.services))
            await this.services[name].close();
    }
}

module.exports = Client;
