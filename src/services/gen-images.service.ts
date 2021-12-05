import { addFileToIPFS } from './add-ipfs.service';
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
        // To create unique image
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