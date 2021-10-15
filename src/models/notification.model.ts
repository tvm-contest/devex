import {Entity, model, property} from '@loopback/repository';

@model()
export class Notification extends Entity {
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
    type: 'string',
    required: true,
  })
  message: string;


  constructor(data?: Partial<Notification>) {
    super(data);
  }
}

export interface NotificationRelations {
  // describe navigational properties here
}

export type NotificationWithRelations = Notification & NotificationRelations;
