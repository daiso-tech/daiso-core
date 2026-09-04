import { HttpRouter } from "eridu-tech/http-router";
import { LinearRouter } from "hono/router/linear-router";

new HttpRouter({ router: new LinearRouter() });
