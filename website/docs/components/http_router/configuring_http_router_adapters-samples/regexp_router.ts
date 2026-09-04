import { HttpRouter } from "eridu-tech/http-router";
import { RegExpRouter } from "hono/router/reg-exp-router";

new HttpRouter({ router: new RegExpRouter() });
