import {Entity, model, property} from '@loopback/repository';

@model({"settings":{"idInjection":false,"postgresql":{"schema":"public","table":"rolemapping"}}})
export class Rolemapping extends Entity {
  @property({
    type: Number,
    required: true,
    scale: 0,
    id: true,
    postgresql: {"columnName":"id","dataType":"integer","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"NO"},
  })
  id: Number;

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
    required: false,
    scale: 0,
    postgresql: {"columnName":"roleid","dataType":"integer","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"YES"},
  })
  roleid?: Number;

  constructor(data?: Partial<Rolemapping>) {
    super(data);
  }
}
