import { addFileToIPFS } from './add-ipfs.service';
const fs = require('fs');
const path = require('path');

type Image = {
    name: string,
    rarity: string,
    ipfsRef: string
}

enum Rarity {
    USUAL,
    NO_USUAL,
    ULTRA_RARITY
}

const helmetsArray: string[] = [
    'helmet1.png',
    'helmet2.png',
    'helmet3.png',
];

const armsArray: string[] = [
    'arm1.png',
    'arm2.png',
    'arm3.png'
];

const shielsdArray: string[] = [
    'shield1.png',
    'shield2.png',
    'shield3.png'
];

const personsArray: string[] = [
    'person1.png',
    'person2.png',
    'person3.png'
];

const bgArray: string[] = [
    'bg1.png',
    'bg2.png',
    'bg3.png'
];

export class TokenImagesCreator {
    // To check whether all images is unique
    private nameAndRarityArray: string[] = [''];

    async createImagesArr(): Promise<Image[]> {
        let imagesArr: Image[] = [];

        for (let i = 0; i < 7; i++) {
            const image: Image = await this.createImage();
            imagesArr.push(image);
        }

        return imagesArr;
    }

    async createImage(): Promise<Image> {
        // For creating image by mergeImages
        let imagesFiles: string[] = [];
        while (true) {
            const bgFile: string = this.getPartFile(bgArray);
            const personFile: string = this.getPartFile(personsArray);
            const shieldFile: string = this.getPartFile(shielsdArray);
            const helmetFile: string = this.getPartFile(helmetsArray);
            const armFile: string = this.getPartFile(armsArray);

            imagesFiles.push(bgFile);
            imagesFiles.push(personFile);
            imagesFiles.push(shieldFile);
            imagesFiles.push(helmetFile);
            imagesFiles.push(armFile);

            var imageRarity = this.getRarity();
            var imageName = imagesFiles.reduce((prev, current) => prev + current) + imageRarity;
            var imageIPFS = await addFileToIPFS(imageName);
            const imageIPFSToString = imageIPFS.toString();
            // Путь куда будут записывать картинки
            const outDir = path.resolve('src', 'sample-data', 'out-images', imageIPFSToString);

            if (!fs.existsSync(imageIPFSToString)) {
                fs.writeFileSync(outDir, imageIPFSToString);
                //
                // Тут нужно создавать изображение, но нужно скачать canvas
                //
                break;
            }
        }

        let image: Image = {
            name: imageName,
            rarity: imageRarity,
            ipfsRef: imageIPFS,
        };

        return image;
    }

    getPartFile(array: string[]): string {
        let key: number = this.getRandomKey(array);
        return array[key];
    }

    getRarity(): string {
        let key: number = this.getRandomKey(Rarity);
        return Rarity[key];
    }

    getRandomKey(enumType: object): number {
        const enumValues = Object.keys(enumType)
            .map(n => Number.parseInt(n))
            .filter(n => !Number.isNaN(n))

        const key: number = Math.floor(Math.random() * enumValues.length);
        return key;
    }
}

export const t = new TokenImagesCreator();