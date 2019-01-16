import {Entity, model, property} from '@loopback/repository';

@model({"settings":{"idInjection":false,"postgresql":{"schema":"public","table":"acl"}}})
export class Acl extends Entity {
  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"model","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  model?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"property","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  property?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"accesstype","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  accesstype?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"permission","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  permission?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"principaltype","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  principaltype?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"principalid","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  principalid?: String;

  @property({
    type: Number,
    required: true,
    scale: 0,
    id: true,
    postgresql: {"columnName":"id","dataType":"integer","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"NO"},
  })
  id: Number;

  constructor(data?: Partial<Acl>) {
    super(data);
  }
}
