import {Entity, model, property} from '@loopback/repository';

@model({"settings":{"idInjection":false,"postgresql":{"schema":"public","table":"useridentity"}}})
export class Useridentity extends Entity {
  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"provider","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  provider?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"authscheme","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  authscheme?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"externalid","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  externalid?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"profile","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  profile?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"credentials","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  credentials?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"created","dataType":"timestamp with time zone","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  created?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"modified","dataType":"timestamp with time zone","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  modified?: String;

  @property({
    type: Number,
    required: true,
    scale: 0,
    id: true,
    postgresql: {"columnName":"id","dataType":"integer","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"NO"},
  })
  id: Number;

  @property({
    type: Number,
    required: false,
    scale: 0,
    postgresql: {"columnName":"userid","dataType":"integer","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"YES"},
  })
  userid?: Number;

  constructor(data?: Partial<Useridentity>) {
    super(data);
  }
}
