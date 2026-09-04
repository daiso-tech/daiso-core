// src/functions/httpTrigger.ts
import { app } from "@azure/functions";
import { azureHonoHandler } from "@marplex/hono-azurefunc-adapter";
import honoApp from "../app";

app.http("httpTrigger", {
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    authLevel: "anonymous",
    route: "{*proxy}",
    handler: azureHonoHandler((request: Request) => honoApp.fetch(request)),
});
