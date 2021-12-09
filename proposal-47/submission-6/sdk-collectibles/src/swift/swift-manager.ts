import { ActionService, SwiftMessage, SwiftService } from "../db";
import { mutexLockOrAwait, mutexUnlock } from "../utils/mutex";
import { SwiftAbiFinder } from "./swift-abi-finder";
import { SwiftDecoder } from "./swift-decoder";
import { SwiftMessageHandler } from "./swift-message-handler/swift-message-handler";
import { EncodedMessage, SwiftWatcher } from "./swift-watcher";

export class SwiftManager {
  private readonly actionService: ActionService;
  private readonly watcher: SwiftWatcher;
  private readonly decoder: SwiftDecoder;
  private readonly abiFinder: SwiftAbiFinder;
  private readonly messageHandler: SwiftMessageHandler;
  private readonly swiftService: SwiftService;

  constructor(
    actionService: ActionService,
    watcher: SwiftWatcher,
    decoder: SwiftDecoder,
    abiFinder: SwiftAbiFinder,
    messageHandler: SwiftMessageHandler,
    swiftService: SwiftService
  ) {
    this.actionService = actionService;
    this.watcher = watcher;
    this.decoder = decoder;
    this.abiFinder = abiFinder;
    this.messageHandler = messageHandler;
    this.swiftService = swiftService;

    this.watcher.messages.on(this.onMessage.bind(this));
  }

  private async onMessage(message: EncodedMessage): Promise<void> {
    await mutexLockOrAwait("processing_swift_message");

    try {
      const isAlreadyProcessed = await this.actionService.hasActionWithHash(message.id);

      if (!isAlreadyProcessed) {
        await this.processMessage(message);
      } else {
        console.log(message.id, "skipped: already processed");
      }
    } finally {
      mutexUnlock("processing_swift_message");
    }
  }

  private async processMessage(message: EncodedMessage): Promise<void> {
    const swiftMessage: SwiftMessage = {
      message: {
        senderAddress: message.src,
        time: message.created_at,
        status: "void"
      },
      createdAt: Math.floor(Date.now() / 1000),
      hash: message.id
    };

    const abi = await this.abiFinder.findAbi(message.src);

    if (!abi) {
      console.log("Couldn't find ABI for", message.id, "(src: " + message.src + ") swift message");
      await this.swiftService.addSwiftMessage(swiftMessage);

      return;
    }

    const decodedMessage = await this.decoder.decode(message, abi);

    if (!decodedMessage.is_success) {
      console.log("Couldn't decode", message.id, "swift message");
      console.log(decodedMessage.error);

      await this.swiftService.addSwiftMessage(swiftMessage);

      return;
    }

    swiftMessage.message.status = "verified";
    swiftMessage.message.actionCode = decodedMessage.data.code;
    swiftMessage.message.superType = decodedMessage.data.superType;
    swiftMessage.parameters = decodedMessage.data.data;

    await this.swiftService.addSwiftMessage(swiftMessage);
    await this.messageHandler.processMessage(decodedMessage.data);
  }
}
