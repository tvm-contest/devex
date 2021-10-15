import {
  Count,
  CountSchema,
  Filter, repository,
  Where
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, param, response
} from '@loopback/rest';
import {Logs} from '../models';
import {LogsRepository} from '../repositories';

export class LoggsController {
  constructor(
    @repository(LogsRepository)
    public logsRepository : LogsRepository,
  ) {}

  @get('/logs/count')
  @response(200, {
    description: 'Logs model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Logs) where?: Where<Logs>,
  ): Promise<Count> {
    return this.logsRepository.count(where);
  }

  @get('/logs')
  @response(200, {
    description: 'Array of Logs model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Logs, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Logs) filter?: Filter<Logs>,
  ): Promise<Logs[]> {
    return this.logsRepository.find(filter);
  }
}
