// lib/my-app-stack.ts
import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";

export class MyAppStack extends cdk.Stack {
    public readonly edgeFn: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const edgeFn = new NodejsFunction(this, "edgeViewer", {
            entry: "lambda/index_edge.ts",
            handler: "handler",
            runtime: lambda.Runtime.NODEJS_22_X,
        });

        const originBucket = new s3.Bucket(this, "originBucket");

        new cloudfront.Distribution(this, "Cdn", {
            defaultBehavior: {
                origin: new origins.S3Origin(originBucket),
                edgeLambdas: [
                    {
                        functionVersion: edgeFn.currentVersion,
                        eventType:
                            cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    },
                ],
            },
        });
    }
}
