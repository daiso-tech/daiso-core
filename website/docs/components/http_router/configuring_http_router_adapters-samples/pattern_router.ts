import { HttpRouter } from "eridu-tech/http-router";
import { PatternRouter } from "hono/router/pattern-router";

new HttpRouter({ router: new PatternRouter() });
