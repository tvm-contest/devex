import { ActionSeriesCreate } from "./ActionSeriesCreate";
import { ActionMintQuery } from "./ActionMintQuery";
import { ActionTokenMint } from "./ActionTokenMint";

export type ActionMessage =
    ActionSeriesCreate | ActionMintQuery | ActionTokenMint;
