import { BaseConfig } from './config.base';

export class Config extends BaseConfig {
    static ENVIRONMENT = 'release';
    static APP_URL = 'https://mahjup.ai';
}