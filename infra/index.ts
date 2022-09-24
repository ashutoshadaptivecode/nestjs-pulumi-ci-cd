import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Step 1: Create an ECS Fargate cluster.

const clusterName = 'nest-pulumi-dev';

const cluster = new awsx.ecs.Cluster(clusterName);
const loadBalancerName = `${clusterName}-lb`;
const repoName = `${clusterName}-repo`;

const appPort = 3000;
const appName = 'nest-pulumi';
const appFile = 'dist/main.js';
const appHealthPath = '/';
const appExternal = true;

// Step 2: Define the Networking for our service.
const alb = new awsx.lb.ApplicationLoadBalancer(loadBalancerName, {
  external: true,
});

const repo = new awsx.ecr.Repository(repoName);

export const image = repo.buildAndPushImage('../');

const authWeb = alb.createListener(appName, {
  port: appPort,
  protocol: 'HTTP',
  external: appExternal,
  targetGroup: {
    port: appPort,
    protocol: 'HTTP',
    healthCheck: {
      path: appHealthPath,
      protocol: 'HTTP',
    },
  },
});

// Step 4: Create a Fargate service task that can scale out.
new awsx.ecs.FargateService(appName, {
  cluster,
  taskDefinitionArgs: {
    // cpu: '1',
    // memory: '3',

    container: {
      //   cpu: 1,
      //   memory: 3,
      image: image,
      command: ['node', appFile],
      portMappings: [authWeb],
      //   environmentFiles: [
      //     { type: 's3', value: 'arn:aws:s3:::ecs-config-crypto-docs/dev/.env' },
      //   ],
    },
  },
  desiredCount: 1,
});

const arn = authWeb.defaultTargetGroup?.targetGroup?.arn;

authWeb.addListenerRule(`${appName}-rule`, {
  actions: [
    {
      type: 'forward',
      order: 1,
      targetGroupArn: arn,
      // forward: { targetGroups: [{ arn }] },
    },
  ],
  conditions: [{ pathPattern: { values: [appHealthPath] } }],
});

export const output = authWeb.endpoint.hostname;
