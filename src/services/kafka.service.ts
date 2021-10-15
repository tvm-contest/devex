import {repository} from '@loopback/repository';
import {Kafka, SASLOptions} from 'kafkajs';
import {User} from '../models';
import {LogsRepository, NotificationRepository, PendingRepository, UserRepository} from '../repositories';
require('dotenv').config();

type Mechanism = 'plain'

const sasl: SASLOptions = {
  mechanism: process.env.SASL_MECHANISM as Mechanism,
  username: process.env.SASL_USERNAME as string,
  password: process.env.SASL_PASSWORD as string,
};

export class KafkaService {
  private client: Kafka;
  offset: string;
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @repository(LogsRepository)
    public logsRepository: LogsRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(PendingRepository)
    public pendingRepository: PendingRepository,
  ) {
    this.client = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [process.env.KAFKA_HOST!],
      sasl,
    });
    this.offset = '0';
    this.connect();
  }


  async connect() {
    const consumer = this.client.consumer({
      groupId: process.env.GROUP_ID as string,
    });
    await consumer.connect().catch(console.log);
    await consumer
      .subscribe({
        topic: process.env.TOPIC as string,
        fromBeginning: true,
      })
      .catch(console.log);
    await consumer.run({
      eachMessage: async ({topic, partition, message}) => {
        const parsedMessage = message.value?.toString().split(' ') as [
          string,
          string,
          string,
        ];

        const users = await this.userRepository.find({where:{
          kafkaId: parsedMessage[0]
        }});

        if(users.length != 0) {

          const notificationId = await this.notificationRepository
          .create({
            kafkaId: parsedMessage[0],
            nonce: parsedMessage[1],
            message: parsedMessage[2],
          })
          .catch(() => {});

          const timestamp = new Date().getTime();
          this.logsRepository
          .create({
            kafkaId: parsedMessage[0],
            nonce: parsedMessage[1],
            timestamp,
          })
          .catch(() => {});

          users.map(async (user: User) => {
            await this.pendingRepository.create({userId: user.id, notificationId: notificationId!.id, timestamp})
          })
        }


      },
    });
  }

}
