import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {VNestedSetsGraphDescendants} from '../models';
import {AwsDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class VNestedSetsGraphDescendantsRepository extends DefaultCrudRepository<
  VNestedSetsGraphDescendants,
  typeof VNestedSetsGraphDescendants.prototype.nodeId
> {
  constructor(
    @inject('datasources.aws') dataSource: AwsDataSource,
  ) {
    super(VNestedSetsGraphDescendants, dataSource);
  }
}
