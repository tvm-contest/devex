import { LastMessageTime } from "../db";
import { SortDirection, TonClient } from "@tonclient/core";
import { is } from "typescript-is";
import { assert } from "../utils/assert";
import { Event } from "../utils/events";
import { RgResult } from "../utils/result";
import { timeout } from "../utils/timeout";
import { MongoRepository } from "typeorm";
import { LastMessageTimeService } from "../db/LastMessageTime/LastMessageTimeService";

export type EncodedMessage = {
  readonly id: string;
  readonly src: string;
  readonly body: string;
  readonly created_at: number;
  readonly dst_transaction: {
    readonly aborted: boolean;
    readonly id: string;
  } | null;
};

export type SwiftWatcherConfig = {
  readonly swiftAddress: string;
  readonly checkMessagesIntervalMs: number;
};

export class SwiftWatcher {
  public readonly messages = new Event<EncodedMessage>();

  private readonly config: SwiftWatcherConfig;
  private readonly lastMessageTime: LastMessageTimeService;

  private readonly ton: TonClient;

  private isStarted = false;

  constructor(
    config: SwiftWatcherConfig,
    ton: TonClient,
    lastMessageTime: MongoRepository<LastMessageTime>
  ) {
    this.lastMessageTime = new LastMessageTimeService(lastMessageTime);
    this.config = config;
    this.ton = ton;
  }

  public start(): void {
    assert(!this.isStarted);
    this.isStarted = true;
    console.log('SWIFT watcher started...');

    this.checkMessagesLoop();
  }

  private async checkMessagesLoop(): Promise<void> {
    while (true) {
      await this.checkMessages();
      await timeout(this.config.checkMessagesIntervalMs);
    }
  }

  private async checkMessages(): Promise<void> {
    const lastMessage = await this.lastMessageTime.get();
    const messages = await this.getLastMessages(lastMessage?.time);
    if (!messages.is_success) {
      console.log("Не удалось получить сообщения swift-контракта");
      console.log(messages.error);
      return;
    }

    for (const message of messages.data) {
      await this.messages.emit(message);
      await this.lastMessageTime.set(message.created_at);
    }

    if (messages.data.length !== 0) {
      console.log("Обработано " + messages.data.length + " swift-сообщений");
    }
  }

  private async getLastMessages(since: number | undefined): Promise<RgResult<EncodedMessage[]>> {
    let result;

    try {
      const queryCollectionResult = await this.ton.net.query_collection({
        collection: "messages",
        order: [
          {
            path: "created_at",
            direction: SortDirection.ASC,
          },
        ],
        filter: {
          created_at: since ? { gt: since } : undefined,
          dst: { eq: this.config.swiftAddress },
        },
        result: "id body created_at src dst_transaction { aborted, id }",
        limit: 100,
      });

      result = queryCollectionResult.result;
    } catch (err: any) {
      return {
        is_success: false,
        error: {
          code: -1,
          message: err.message,
        },
      };
    }

    const encodedMessages: EncodedMessage[] = [];
    for (const entry of result) {
      if (!is<EncodedMessage>(entry)) continue;

      encodedMessages.push(entry);
    }

    return {
      is_success: true,
      data: encodedMessages
    };
  }
}
