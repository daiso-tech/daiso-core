export class RequestHandler {
    constructor(private requestId: string) {
        /* ... */
    }

    async handle(): Promise<void> {
        console.log(`Handling request: ${this.requestId}`);
    }
}
