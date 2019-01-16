import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {AwsDataSource} from '../datasources';
import {inject} from '@loopback/core';
import {VNestedSetsGraphSourceNode} from '../models/v-nested-sets-graph-source-node.model';

export class VNestedSetsGraphSourceNodeRepository extends DefaultCrudRepository<
  VNestedSetsGraphSourceNode,
  typeof VNestedSetsGraphSourceNode.prototype.nodeId
> {
  constructor(
    @inject('datasources.aws') dataSource: AwsDataSource,
  ) {
    super(VNestedSetsGraphSourceNode, dataSource);
  }
}
