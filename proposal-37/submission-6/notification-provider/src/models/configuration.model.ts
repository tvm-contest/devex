import {Entity, model, property} from '@loopback/repository';

@model()
export class Configuration extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'number',
    required: true,
  })
  resetPeriod: number;

  @property({
    type: 'number',
    required: true,
  })
  deliveryPeriod: number;


  constructor(data?: Partial<Configuration>) {
    super(data);
  }
}

export interface ConfigurationRelations {
  // describe navigational properties here
}

export type ConfigurationWithRelations = Configuration & ConfigurationRelations;
