import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Pending, PendingRelations} from '../models';

export class PendingRepository extends DefaultCrudRepository<
  Pending,
  typeof Pending.prototype.id,
  PendingRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Pending, dataSource);
  }
}
