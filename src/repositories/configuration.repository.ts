import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Configuration, ConfigurationRelations} from '../models';

export class ConfigurationRepository extends DefaultCrudRepository<
  Configuration,
  typeof Configuration.prototype.id,
  ConfigurationRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Configuration, dataSource);
  }
}
