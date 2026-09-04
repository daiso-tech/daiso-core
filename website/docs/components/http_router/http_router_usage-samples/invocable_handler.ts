import {
    type IHttpHandlerObject,
    type HttpHandlerArgs,
} from "eridu-tech/http-router/contracts";

class GreetingHandler implements IHttpHandlerObject {
    constructor(private readonly greeting: string) {}

    invoke(args: HttpHandlerArgs): IHttpRes {
        const { text } = args;
        return text(this.greeting);
    }
}

router.endpoint({
    url: "/greet",
    method: ["GET"],
    handler: new GreetingHandler("Hello from a class handler!"),
});
