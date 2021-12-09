import { SwiftMessage } from "../../swift/swift-messages";
import { Message } from "../../db";

export function createActionMessage<T extends SwiftMessage>(swiftMessage: T): Message<T["code"]> {
  return {
    actionCode: swiftMessage.code,
    superType: swiftMessage.superType,
    hash: swiftMessage.rawMessage.id,
    senderID: swiftMessage.rawMessage.src,
    senderAddress: swiftMessage.rawMessage.src,
    time: swiftMessage.rawMessage.created_at
  };
}
