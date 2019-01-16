import {inject} from '@loopback/core';
import {juggler} from '@loopback/repository';
import * as config from './aws.datasource.json';

export class AwsDataSource extends juggler.DataSource {
  static dataSourceName = 'aws';

  constructor(
    @inject('datasources.config.aws', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
