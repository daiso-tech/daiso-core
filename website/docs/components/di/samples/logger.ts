export interface ILogger {
    log(message: string): void;
}

export class Logger implements ILogger {
    log(message: string): void {
        /* ... */
    }
}

export class ConsoleLogger implements ILogger {
    log(message: string): void {
        /* ... */
    }
}

export class FileLogger implements ILogger {
    log(message: string): void {
        /* ... */
    }
}
