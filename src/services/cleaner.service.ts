import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ConfigurationRepository, LogsRepository} from '../repositories';
import {sleep} from '../utils';

@injectable({scope: BindingScope.TRANSIENT})
export class CleanerService {

  constructor(
    @repository(LogsRepository)
    public logsRepository: LogsRepository,
    @repository(ConfigurationRepository)
    public configurationRepository: ConfigurationRepository,
  ) {
    this.clearLogs();
  }

  async clearLogs() {
    const confModule = await this.configurationRepository.find();
    const timestamp = new Date().getTime() - 604800; // week

    await this.logsRepository.deleteAll({timestamp: {lt:timestamp}})

    await sleep(confModule[0].resetPeriod);
    this.clearLogs();
  }
}
