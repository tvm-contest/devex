import {Entity, model, property} from '@loopback/repository';

@model()
export class Logs extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  kafkaId: string;

  @property({
    type: 'string',
    required: true,
  })
  nonce: string;

  @property({
    type: 'number',
    required: true,
  })
  timestamp: number;


  constructor(data?: Partial<Logs>) {
    super(data);
  }
}

export interface LogsRelations {
  // describe navigational properties here
}

export type LogsWithRelations = Logs & LogsRelations;
