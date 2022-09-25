import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

const clusterName = 'nest-pulumi-dev';
const appPort = 3000;
const appName = 'nest-pulumi';
const appFile = 'dist/main.js';
const appHealthPath = '/health';
const appExternal = true;
const loadBalancerName = `${clusterName}-lb`;
const repoName = `${clusterName}-repo`;

// Create a repository.
const repo = new awsx.ecr.Repository(repoName);
const buildImage = repo.buildAndPushImage('../');

const cluster = new awsx.ecs.Cluster(clusterName);
const lb = new awsx.lb.ApplicationLoadBalancer(loadBalancerName, {
  external: true,
});

const webApp = lb.createListener(appName, {
  port: appPort,
  protocol: 'HTTP',
  external: appExternal,
  targetGroup: {
    port: appPort,
    protocol: 'HTTP',
    // healthCheck: {
    //   path: appHealthPath,
    //   protocol: 'HTTP',
    // },
  },
});

new awsx.ecs.FargateService(appName, {
  cluster,
  desiredCount: 2,
  os: 'linux',

  taskDefinitionArgs: {
    container: {
      image: buildImage,
      cpu: 1024,
      memory: 2048,
      essential: true,
      portMappings: [webApp],
      command: ['node', appFile],
      //   environmentFiles: [
      //     { type: 's3', value: 'arn:aws:s3:::ecs-config-crypto-docs/dev/.env' },
      //   ],
    },
  },
});

const arn = webApp.defaultTargetGroup?.targetGroup?.arn;

webApp.addListenerRule(`${appName}-rule`, {
  actions: [
    {
      type: 'forward',
      order: 1,
      targetGroupArn: arn,
    },
  ],
  conditions: [{ pathPattern: { values: [appHealthPath] } }],
});

export const output = webApp.endpoint.hostname;
