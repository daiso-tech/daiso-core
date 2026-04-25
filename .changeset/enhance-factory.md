---
"@daiso-tech/core": minor
---

Added new middleware utility `enhanceFactory` that allows apply middlewares to methods.

Works with object literal methods:

```ts
import { enhanceFactory, type MiddlewareFn } from "@daiso-tech/core/middleware";

const enhance = enhanceFactory();
function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        const argsAsStr = args.map(arg => String(arg)).join(", ");
        console.log(`args: ${argsAsStr}`)
        return await next();
    }
}

const obj = {
    async hello(name: string): Promise<string> {
        return `Hello world, ${name}`;
    },
};
enhance(obj, "hello", [log()]);

// Will log "args: Jhon"
await obj.hello("Jhon");
```

Works with instance methods:

```ts
import { enhanceFactory, type MiddlewareFn } from "@daiso-tech/core/middleware";

const enhance = enhanceFactory();
function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        const argsAsStr = args.map(arg => String(arg)).join(", ");
        console.log(`args: ${argsAsStr}`)
        return await next();
    }
}

class Obj {
    async hello(name: string): Promise<string> {
        return `Hello world, ${name}`;
    }
}
const obj = new Obj();
enhance(obj, "hello", [log()]);

// Will log "args: Jhon"
await obj.hello("Jhon");
```

Works with static methods:

```ts
import { enhanceFactory, type MiddlewareFn } from "@daiso-tech/core/middleware";

const enhance = enhanceFactory();
function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        const argsAsStr = args.map(arg => String(arg)).join(", ");
        console.log(`args: ${argsAsStr}`)
        return await next();
    }
}

class Obj {
    static async hello(name: string): Promise<string> {
        return `Hello world, ${name}`;
    }
}
enhance(Obj, "hello", [log()]);

// Will log "args: Jhon"
await Obj.hello("Jhon");
```

Works with prototypes methods:

```ts
import { enhanceFactory, type MiddlewareFn } from "@daiso-tech/core/middleware";

const enhance = enhanceFactory();
function log<TReturn>(): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        const argsAsStr = args.map(arg => String(arg)).join(", ");
        console.log(`args: ${argsAsStr}`)
        return await next();
    }
}

class Obj {
    async hello(name: string): Promise<string> {
        return `Hello world, ${name}`;
    }
}
enhance(Obj.prototype, "hello", [log()]);

const obj = new Obj();

// Will log "args: Jhon"
await obj.hello("Jhon");
```
