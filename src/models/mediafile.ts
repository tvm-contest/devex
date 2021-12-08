import { Parametr } from "./parametr";

export class MediaFile extends Parametr {

    constructor(mediaFileName: string, type: string) {
        super(mediaFileName, 'string');
    }
}