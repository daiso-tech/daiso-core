import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";

const router = new HttpRouter({
    router: new SmartRouter({
        routers: [new RegExpRouter(), new TrieRouter()],
    }),
});
