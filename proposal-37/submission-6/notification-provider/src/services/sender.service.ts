import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import axios from 'axios';
import {Notification, Pending} from '../models';
import {ConfigurationRepository, NotificationRepository, PendingRepository, UserRepository} from '../repositories';
import {sleep} from '../utils';

@injectable({scope: BindingScope.TRANSIENT})
export class SenderService {

  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(PendingRepository)
    public pendingRepository: PendingRepository,
    @repository(ConfigurationRepository)
    public configurationRepository: ConfigurationRepository,
  ) {
    this.sendMsgs();
  }

  async sendMsgs() {

    const confModule = await this.configurationRepository.find();
    const notifications = await this.notificationRepository.find();

    notifications.map(async (notification: Notification) => {

      const pendings = await this.pendingRepository.find({where:{
        notificationId: notification.id
      }});

      if(pendings.length != 0) {
        pendings.map(async (pending: Pending) => {
          const user = await this.userRepository.findById(pending.userId);
          try {
            const response = await axios.request({
              method: 'POST',
              url: `${(user.url)}`,
              headers: {
                accept: 'application/json',
              },
              data: {
                nonce: notification.nonce,
                message: notification.message
              },
            });
            if(response.status === 200) {
              await this.pendingRepository.deleteById(pending.id);
            }
          } catch (error) {
            const nowTimestamp = new Date().getTime();
            if(pending.timestamp - nowTimestamp < confModule[0].resetPeriod) {
              await this.pendingRepository.deleteById(pending.id);
            }
            console.log(0, `${user.url} is not available`);
          }
        })
      } else {
        await this.notificationRepository.deleteById(notification.id);
      }
    })

    await sleep(confModule[0].deliveryPeriod);
    this.sendMsgs();
  }
}
