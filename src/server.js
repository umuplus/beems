'use strict';

const Base = require('./base');
const is = require('is_js');
const Queue = require('bee-queue');
const Service = require('./service');
const { cpus } = require('os');

class Server extends Base {
    /**
     *Creates an instance of Server.
     * @param {Object} [options] options
     * @memberof Server
     */
    constructor(options) {
        super(options);
    }

    /**
     * @description adds list of services and automatically creates their queues and consumers
     * @param {Array<Function>} services list of service classes
     * @param {Number} [concurrency=1] flag for consuming queue in parallel
     * @param {Object} [options={}] options for creating a new queue
     * @see https://github.com/bee-queue/bee-queue#settings
     * @throws Error
     * @memberof Server
     */
    async addServices(services, concurrency = cpus().length, options) {
        if (is.not.array(services)) throw new Error('invalid services');

        for (const service of services)
            await this.addService(service, concurrency, options);
    }

    /**
     * @description adds a new Service instance and
     *              automatically creates related queue with consumers
     * @param {Service} instance Service instance
     * @param {Number} [concurrency=1] flag for consuming queue in parallel
     * @param {Object} [options={}] options for creating a new queue
     * @see https://github.com/bee-queue/bee-queue#settings
     * @throws Error
     * @memberof Server
     */
    async addService(instance, concurrency = cpus().length, options) {
        if (is.object(concurrency)) {
            options = concurrency;
            concurrency = 1;
        }
        if (is.not.object(options)) options = this.options.bee;
        else if (!(instance instanceof Service))
            throw new Error('service must be an instance of a class that extends Service');

        const name = instance._name();
        if (is.not.existy(this.services[name])) {
            this.services[name] = new Queue(name, options);
            await this.services[name].ready();
            this.logger.info(`${ name }|ready(S)`);
            this.services[name].on('error',
                e => this.logger.warn(`${ name }|E|${ e.message }`));
            if (this.logger.isLevelEnabled('warn')) {
                this.services[name].on('failed',
                    (j, e) => this.logger.warn(`${ name }|F|${ j.id }|${ e.message }`));
                this.services[name].on('stalled',
                    (j) => this.logger.warn(`${ name }|S|${ j }`));
            }
            if (this.logger.isLevelEnabled('info')) {
                this.services[name].on('retrying',
                    (j, e) => this.logger.info(`${ name }|R|${ j.id }|${ e.message }`));
                this.services[name].on('job progress',
                    (j, p) => this.logger.info(`${ name }|P|${ j }|${ p }%`));
                this.services[name].on('succeeded', (j, r) => {
                    this.logger.info(`${ name }|OK|${ j.id }|${ JSON.stringify(r) }`);
                });
            }
            this.services[name].process(concurrency, async job => await instance._run(job));
        }
    }

    /**
     * @description stops all existing queues for a clean shutdown
     * @returns Promise
     * @memberof Server
     */
    async close() {
        for (const name of Object.keys(this.services))
            await this.services[name].close();
    }

    /**
     * @description removes everything about existing queues from redis
     * @returns Promise
     * @memberof Server
     */
    async destroy() {
        for (const name of Object.keys(this.services))
            await this.services[name].destroy();
    }
}

module.exports = Server;
