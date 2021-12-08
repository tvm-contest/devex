import { EncodedMessage } from "./swift-watcher";

type BaseSwiftMessage = {
  readonly name: string;
  readonly superType: string;
  readonly actionCapture: string;
  readonly rawMessage: EncodedMessage;
};

export type SeriesCreate = BaseSwiftMessage & {
  readonly code: "SRC-CT";
  readonly majorVersion: "nifi.col1";
  readonly data: {
    /** Ask ID */
    readonly id: string;
  };
};

export type MintQuery = BaseSwiftMessage & {
  readonly code: "SRC-PY";
  readonly majorVersion: "nifi.col1";
  readonly data: {
    /** Ask ID */
    readonly collectionId: string;
    readonly value: string;
    readonly owner: string;
    readonly futureId: string;
  };
};

export type TokenMint = BaseSwiftMessage & {
  readonly code: "TK-MT";
  readonly majorVersion: "nifi.col1";
  readonly data: {
    /** Ask ID */
    readonly collectionId: string;
    readonly index: string;
    readonly id1: string;
    readonly id2: string;
    readonly id3: string;
    readonly id4: string;
    readonly id5: string;
  };
};

export type SwiftMessage =
    SeriesCreate | MintQuery | TokenMint;
