// bin/my-app.ts
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyAppStack } from "../lib/my-app-stack";

const app = new cdk.App();
new MyAppStack(app, "MyAppStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: "us-east-1",
    },
});
