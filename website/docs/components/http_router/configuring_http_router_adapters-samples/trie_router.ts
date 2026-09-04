import { HttpRouter } from "eridu-tech/http-router";
import { TrieRouter } from "hono/router/trie-router";

new HttpRouter({ router: new TrieRouter() });
