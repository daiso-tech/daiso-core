/**
 * @module HttpRouter
 */

import { type StandardSchemaV1 } from "@standard-schema/spec";

import {
    type IHttpRes,
    type IHttpResHelpers,
} from "@/http-router/contracts/_module.js";
import { HttpRes } from "@/http-router/implementations/http-res.js";
import { validateSync } from "@/utilities/_module.js";

/**
 * @internal
 */
export const httpResHelpers: IHttpResHelpers = {
    fromWebRes(res: Response): IHttpRes {
        return new HttpRes({
            headers: res.headers,
            status: res.status,
            statusText: res.statusText,
            body: res.body ?? null,
        });
    },
    text(content: string): IHttpRes {
        return new HttpRes().setBody(content).setContentType("text/plain");
    },
    html(content: string): IHttpRes {
        return new HttpRes().setBody(content).setContentType("text/html");
    },
    json<TData>(
        content: TData,
        schema?: StandardSchemaV1<unknown, TData>,
    ): IHttpRes {
        if (schema !== undefined) {
            content = validateSync(schema, content);
        }
        return new HttpRes()
            .setBody(JSON.stringify(content))
            .setContentType("application/json");
    },
    notFound(): IHttpRes {
        return new HttpRes()
            .setBody("Not found")
            .setContentType("text/html")
            .setStatus(404);
    },
    redirect(url: string): IHttpRes {
        return new HttpRes()
            .setStatus(302)
            .setLocation(url)
            .setContentType("text/plain");
    },
    permanentRedirect(url: string): IHttpRes {
        return new HttpRes()
            .setStatus(301)
            .setLocation(url)
            .setContentType("text/plain");
    },
};
