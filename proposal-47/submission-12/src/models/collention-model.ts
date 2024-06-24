import { Param} from "./param-model";
import { RarityType } from "./rarity-model";

export interface CollectionModel {
    rootName: string;
    rootIcon: string;
    raritiesList: RarityType[];
    paramsData?: Param[];
    paramsRoot?: Param[];
}