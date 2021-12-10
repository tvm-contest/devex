import {Entity, model, property} from '@loopback/repository';

@model()
export class Pending extends Entity {
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
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  notificationId: string;

  @property({
    type: 'number',
    required: true,
  })
  timestamp: number;

  constructor(data?: Partial<Pending>) {
    super(data);
  }
}

export interface PendingRelations {
  // describe navigational properties here
}

export type PendingWithRelations = Pending & PendingRelations;
