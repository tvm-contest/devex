import { addFileToIPFS } from './add-ipfs.service';
const fs = require('fs');
// const ipfServer = require('./add-ipfs.service');

type Image = {
    name: string,
    rarity: string,
    ipfsRef: string
}

enum Colors {
    RED,
    GREEN,
    ORANGE
};

enum Size {
    SMALL,
    MIDDLE,
    BIG
};

enum Glass {
    GLASS,
    NO_GLASS
};

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

// Фон
// Человек
// Щит 
// Шлем
// Оружие
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

        while (true) {
            const imageColor: string = this.getColor();
            const imageSize: string = this.getSize();
            const imageGlass: string = this.getGlass();

            var imageName = `${imageColor} ${imageSize} ${imageGlass}`;
            var imageRarity = this.getRarity();
            const nameAndRarity: string = imageName + imageRarity;

            var imageIPFS = await addFileToIPFS(nameAndRarity);
            if (!this.nameAndRarityArray.includes(nameAndRarity)) {
                // Push if nameAndRarity(image) is unique
                this.nameAndRarityArray.push(nameAndRarity);
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

    getPartFile(array: string[]): string{
        let key: number = this.getRandomKey(array);
        return array[key];
    }
    
    getColor(): string {
        let key: number = this.getRandomKey(Colors);
        return Colors[key];
    }

    getSize(): string {
        let key: number = this.getRandomKey(Size);
        return Size[key];
    }

    getGlass(): string {
        let key: number = this.getRandomKey(Glass);
        return Glass[key];
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