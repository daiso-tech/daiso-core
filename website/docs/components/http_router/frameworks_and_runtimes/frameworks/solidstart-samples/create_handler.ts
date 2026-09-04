// src/routes/api/[...route].ts
import {
    HttpRouter,
    HttpRes,
    defaultHttpRouterAdapter,
} from "eridu-tech/http-router";
import type { APIEvent } from "@solidjs/start/server";

const router = new HttpRouter({ router: defaultHttpRouterAdapter });

router.endpoint({
    url: "/api/hello",
    method: "GET",
    handler: async () => HttpRes.text("Hello from SolidStart!"),
});

export const GET = ({ request }: APIEvent) => router.fetch(request);
export const HEAD = ({ request }: APIEvent) => router.fetch(request);
export const POST = ({ request }: APIEvent) => router.fetch(request);
export const PUT = ({ request }: APIEvent) => router.fetch(request);
export const DELETE = ({ request }: APIEvent) => router.fetch(request);
export const PATCH = ({ request }: APIEvent) => router.fetch(request);
export const OPTIONS = ({ request }: APIEvent) => router.fetch(request);
