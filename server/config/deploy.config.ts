//DO NOT REFERENCE CLASS OUTSIDE OF ANY DEPLOYMENT SCRIPTS, USE PLATFORM.SERVICE INSTEAD!
export class DeployConfig {
    static INJECTED_PLATFORM_ID = 1;
    static DOMAIN: string = 'mahjup.ai';
    static BUCKET: string = 'mahjup.release';
    static CLOUDFRONT_DISTRIBUTION_NAME: string = 'MahjUp';
    static CLOUDFRONT_DISTRIBUTION: string = 'E16Y48A4EHLT6B';
    static AWS_ACCESS_KEY = "";
    static AWS_ACCESS_SECRET = "";
    static SERVER = "";
    static SOURCE_API_NAME: string = 'cortex-release-api';
    static API_GATEWAY_NAME: string = 'mahjup-release-api';
    static LAMBDA_ARN: string = 'arn:aws:lambda:us-east-1:916951148689:function:mahjup-release-api';
}