import {Entity, model, property} from '@loopback/repository';

@model({"settings":{"idInjection":false,"postgresql":{"schema":"public","table":"user"}}})
export class User extends Entity {
  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"realm","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  realm?: String;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"username","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  username?: String;

  @property({
    type: String,
    required: true,
    postgresql: {"columnName":"password","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"NO"},
  })
  password: String;

  @property({
    type: String,
    required: true,
    postgresql: {"columnName":"email","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"NO"},
  })
  email: String;

  @property({
    type: Boolean,
    required: false,
    postgresql: {"columnName":"emailverified","dataType":"boolean","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  emailverified?: Boolean;

  @property({
    type: String,
    required: false,
    postgresql: {"columnName":"verificationtoken","dataType":"text","dataLength":null,"dataPrecision":null,"dataScale":null,"nullable":"YES"},
  })
  verificationtoken?: String;

  @property({
    type: Number,
    required: true,
    scale: 0,
    id: true,
    postgresql: {"columnName":"id","dataType":"integer","dataLength":null,"dataPrecision":null,"dataScale":0,"nullable":"NO"},
  })
  id: Number;

  constructor(data?: Partial<User>) {
    super(data);
  }
}
