import {Entity, model, property} from '@loopback/repository';

@model({"settings":{"idInjection":false,"postgresql":{"schema":"public","table":"v_nested_sets_graph_internal_node"}}})
export class VNestedSetsGraphInternalNode extends Entity {
  @property({
    type: Number,
    required: false,
    scale: 0,
    postgresql: {"columnName":"node_id","dataType":"bigint","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"YES"},
  })
  nodeId?: Number;

  constructor(data?: Partial<VNestedSetsGraphInternalNode>) {
    super(data);
  }
}
