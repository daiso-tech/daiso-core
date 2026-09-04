// lib/my-app-stack.ts
import * as cdk from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class MyAppStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const fn = new NodejsFunction(this, "lambda", {
            entry: "lambda/index.ts",
            handler: "handler",
            runtime: Runtime.NODEJS_22_X,
        });
        const fnUrl = fn.addFunctionUrl({
            authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
        });
        new cdk.CfnOutput(this, "lambdaUrl", {
            value: fnUrl.url!,
        });
    }
}
