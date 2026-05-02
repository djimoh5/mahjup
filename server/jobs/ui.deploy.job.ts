import { Job } from '../../model/job.model';

import { S3Service } from '../service/s3.service';
import { CloudFrontService } from '../service/cloudfront.service';
import { DeleteObjectsRequest, ListObjectsV2Request, _Object } from '@aws-sdk/client-s3';

import { Bootstrap, Injectable } from '../config/bootstrap';
import { DeployConfig } from '../config/deploy.config';
import { Common } from '../utility/common';
import { GenericMap } from '../../model/shared.model';

var fs = require('fs');

@Injectable()
@Bootstrap()
export class UIDeployJob extends Job {
    envMap: GenericMap<string> = {
        'sprint': '.sprint',
        'qa': '.qa',
        'demo': '.demo',
        'staging': '.staging',
        'release': '.release'
    };

    excludedFiles = [
        'favicon.ico'
    ];

    ignoreAssets = false;

    constructor(private s3Service: S3Service, private cloudFrontService: CloudFrontService) {
        super('UIDeploy');

        this.s3Service.init(DeployConfig.AWS_ACCESS_KEY, DeployConfig.AWS_ACCESS_SECRET);
    }

    async run(_context: {}) {
        await this.deployBucket(DeployConfig.BUCKET);
        this.done({ success: true });
    }

    async deployBucket(bucket: string) {
        console.log('--------------------', bucket, '--------------------');

        //try to upload one file first to make sure build did not fail
        await this.uploadFile('../dist/index.html', 'index.html', bucket, 'no-cache, no-store, must-revalidate');

        await this.deleteFiles(bucket);

        await this.uploadFiles('../dist/', bucket);

        await this.oneTimeDeploy(bucket);

        try {
            await this.invalidateCloudFrontCache(DeployConfig.CLOUDFRONT_DISTRIBUTION);
        } catch (_ex) {
            await this.invalidateCloudFrontCache(DeployConfig.CLOUDFRONT_DISTRIBUTION);
        }
    }

    private async oneTimeDeploy(_bucket: string) {
        //await this.uploadFile('../dist/favicon.ico', 'favicon.ico', _bucket, 'no-cache');
    }

    private async deleteFiles(bucket: string, continuationToken?: string) {
        return new Promise(resolve => {
            var params: ListObjectsV2Request = { Bucket: bucket, MaxKeys: 100 }; //100 is the highest allowed
            if (continuationToken) {
                params.ContinuationToken = continuationToken;
            }

            this.s3Service.s3.listObjectsV2(params, async (err, data) => {
                if (err) {
                    //this.errorService.logError(`S3 - List Objects Failed: ${bucket}/`, err, ErrorType.Handled, this.auditUserId, { params });
                    throw (err);
                }

                var params: DeleteObjectsRequest = {
                    Bucket: bucket,
                    Delete: { Objects: [] }
                };

                for (var i = 0, s3Obj: _Object; s3Obj = data.Contents[i]; i++) {
                    if ((!this.ignoreAssets || s3Obj.Key.substring(0, 7) !== 'assets/') && this.excludedFiles.indexOf(s3Obj.Key) < 0) {
                        params.Delete.Objects.push({ Key: s3Obj.Key });
                    }
                }

                if (params.Delete.Objects.length > 0) {
                    this.s3Service.s3.deleteObjects(params, err => {
                        if (err) {
                            //this.errorService.logError(`S3 - Delete Failed: ${bucket}/`, err, ErrorType.Handled, this.auditUserId, { params });
                            throw (err);
                        }

                        console.log('Deleted', params.Delete.Objects.length, 'files');

                        this.nextDeleteFiles(bucket, data, resolve);
                    });
                }
                else {
                    this.nextDeleteFiles(bucket, data, resolve);
                }
            });
        });
    }

    private async nextDeleteFiles(bucket: any, data: any, resolve: any) {
        if (data.NextContinuationToken) {
            await this.deleteFiles(bucket, data.NextContinuationToken);
        }

        resolve();
    }

    private async uploadFiles(dir: string, bucket: string, keyPrefix = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let num = 0;
        for (const entry of entries) {
            const localPath = dir + entry.name;
            const s3Key = keyPrefix + entry.name;
            if (entry.isDirectory()) {
                await this.uploadFiles(localPath + '/', bucket, s3Key + '/');
            } else if (this.excludedFiles.indexOf(entry.name) < 0) {
                const cacheControl = keyPrefix.startsWith('assets/') ? 'max-age=31536000, immutable' : 'no-cache';
                await this.uploadFile(localPath, s3Key, bucket, cacheControl);
                num++;
            }
        }
        if (!keyPrefix) {
            console.log('Uploaded', num, 'root-level files');
        }
    }

    private async uploadFile(sourceFilePath: string, destinationKey: string, bucket: string, cacheControl = 'no-cache') {
        return new Promise<void>(resolve => {
            let body = fs.createReadStream(sourceFilePath);

            this.s3Service.s3.putObject({
                Bucket: bucket,
                Key: destinationKey,
                Body: body,
                ContentType: Common.getContentTypeFromName(sourceFilePath),
                CacheControl: cacheControl,
                ACL: 'public-read'
            }, err => {
                if (err) {
                    //this.errorService.logError(`S3 - Put Failed: ${bucket}/${destinationKey}`, err, ErrorType.Handled, this.auditUserId, { bucket, destinationKey });
                    throw (err);
                }

                resolve();
            });
        });
    }

    private async invalidateCloudFrontCache(distributionId: string) {
        const files = ['/', '/index.html', '/favicon.ico'];

        const res = await this.cloudFrontService.invalidateCache(distributionId, files);

        if (!res.success) {
            const err = res.data;
            console.log(err);
            //this.errorService.logError('Unable to invalidate CloudFront', err, ErrorType.Handled, this.auditUserId, { distributionId });
        }
        else {
            console.log('CloudFront index.html invalidated', distributionId, res.data.Location);
        }

        return res.data;
    }
}