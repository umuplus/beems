import { QueueSettings } from 'bee-queue';
import * as pino from 'pino';

export interface Options {
    bee?: QueueSettings;
    job?: object;
    pino?: pino.LoggerOptions;
}

export class Base {
    protected options: Options;
    protected logger: pino.Logger;

    constructor(options: Options) {
        this.options = Object.assign({}, options || {});
        this.logger = pino(Object.assign({ level: 'error' }, this.options.pino || {}));
    }
}
