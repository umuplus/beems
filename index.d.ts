export interface Options {
    bee?: object;
    job?: object;
    pino?: object;
}

export class Service {
    constructor(name: string, options?: object);
    _name(): string;
    _run(): Promise<any>;
}

export class Client {
    constructor(options?: Options);
    acceptService(service: string, options?: object): void;
    acceptServices(services: string[], options?: object): void;
    close(): Promise<any>;
    health(service: string): Promise<any>;
    job(service: string, id: number): Promise<any>;
    forward(service: string, method: string, data: object, options?: object): Promise<any>;
    send(service: string, method: string, data: object, options?: object): Promise<any>;
}

export class Server {
    constructor(options?: Options);
    addService(service: Service, concurrency?: number, options?: object): Promise<any>;
    addServices(services: Service[], concurrency?: number, options?: object): Promise<any>;
    close(): Promise<any>;
    destroy(): Promise<any>;
}
