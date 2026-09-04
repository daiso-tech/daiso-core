import { EnvAccessor } from "eridu-tech/env-accessor";
import { z } from "zod";
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Combine AWS Secrets Manager and process.env as sources
// Note: The order matters—later sources override previous ones for overlapping keys.
const secretsManager = new SecretsManagerClient({ region: "us-east-1" });
const sources = [
    process.env,
    async () => {
        const secret = await secretsManager.send(
            new GetSecretValueCommand({ SecretId: "my-app/env" }),
        );
        return JSON.parse(secret.SecretString ?? "{}");
    },
];

// Define a schema for your environment variables
const schema = z.object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().pipe(z.coerce.number()).default("3000"),
});

// Initialize the accessor
const accessor = new EnvAccessor({ schema, sources });
await accessor.init();
