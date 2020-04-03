'use strict';

const is = require('is_js');
const pino = require('pino');

/**
 * @description Base class
 * @class Base
 */
class Base {
  /**
   * @description Creates an instance of Base.
   * @param {Object} options
   * @memberof Base
   */
  constructor(options) {
    this.options = Object.assign({}, options || {});

    this.logger = pino(
      Object.assign({ level: 'error' }, is.object(this.options.pino) ? this.options.pino : {}),
    );
    this.services = {};
  }
}

module.exports = Base;
