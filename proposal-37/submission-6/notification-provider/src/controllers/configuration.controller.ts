import {
  Count,
  CountSchema,
  Filter, repository,
  Where
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef, param, patch, requestBody,
  response
} from '@loopback/rest';
import {Configuration} from '../models';
import {ConfigurationRepository} from '../repositories';

export class ConfigurationController {
  constructor(
    @repository(ConfigurationRepository)
    public configurationRepository : ConfigurationRepository,
  ) {}

  @get('/configurations')
  @response(200, {
    description: 'Array of Configuration model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Configuration, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Configuration) filter?: Filter<Configuration>,
  ): Promise<Configuration[]> {
    return this.configurationRepository.find(filter);
  }

  @patch('/configurations')
  @response(200, {
    description: 'Configuration PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Configuration, {partial: true}),
        },
      },
    })
    configuration: Configuration,
    @param.where(Configuration) where?: Where<Configuration>,
  ): Promise<Count> {
    return this.configurationRepository.updateAll(configuration, where);
  }
}
