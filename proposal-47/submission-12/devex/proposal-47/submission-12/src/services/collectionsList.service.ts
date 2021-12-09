import { globals } from '../config/globals';
import fs from 'fs';


export class GetCollectionsList {

    async getCollectionsList(): Promise<string[]> {

        let collectionDirList = fs.readdirSync(globals.TEMP_PATH, {withFileTypes: true}).filter((fileOrDir) => {
            return fileOrDir.isDirectory()
          })
        let collectionsInfoList : string[] = []
        for (const Dir of collectionDirList) {
                let collectionInfoJson = await JSON.parse(fs.readFileSync(globals.TEMP_PATH + "\\" + Dir.name + '\\inputRootParameters.json').toString());
                collectionsInfoList.push(collectionInfoJson);
        }
        return collectionsInfoList;
    }
}