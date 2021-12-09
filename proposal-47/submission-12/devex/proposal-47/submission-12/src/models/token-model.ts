import { RarityType } from "./rarity-model";
import { Param } from "./param-model";

export interface Token {
    rarityType: RarityType;
    params: Param[];
}