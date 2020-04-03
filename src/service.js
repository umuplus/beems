'use strict';

const is = require('is_js');

/**
 * @description Service class
 * @class Service
 */
class Service {
  /**
   * @description Creates an instance of Service.
   * @param {String} name service name
   * @memberof Service
   */
  constructor(name) {
    if (is.string(name) && is.not.empty(name)) this.name = name;
    else throw new Error(`invalid service name: ${name}`);
  }

  /**
   * @description returns service name
   * @returns String
   * @memberof Service
   */
  _name() {
    return this.name;
  }

  /**
   * @description executes service handler
   * @param {String} name method name
   * @param {Object} job payload
   * @memberof Service
   */
  async _run(job) {
    if (is.not.object(job) || is.not.object(job.data)) throw new Error('invalid job');

    const { _: method } = job.data;
    if (is.not.string(method) || method.startsWith('_')) throw new Error('invalid method name');
    else if (is.not.function(this[method])) throw new Error('invalid method');
    else if (this[method].constructor.name !== 'AsyncFunction')
      throw new Error('method must be an async function');
    else return await this[method](job);
  }
}

module.exports = Service;
