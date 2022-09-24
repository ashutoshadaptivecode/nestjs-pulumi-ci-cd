import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket('my-bucket');

// Export the name of the bucket
console.log('id ', bucket.id);

export const bucketName = bucket.id;
