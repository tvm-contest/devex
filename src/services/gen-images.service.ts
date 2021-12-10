import { globals } from '../config/globals';
import { addFileToIPFS } from './add-ipfs.service';
const fs = require('fs');
const path = require('path');

const { Canvas, Image } = require('canvas');
const mergeImages = require('merge-images');

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

const DIR_OF_IMAGES = path.resolve('src', 'sample-data', 'images-for-token');

export class TokenImageCreator {

    async createTokenImage(tokenImageFile: string) {
        // For creating image by mergeImages
        let imgArray: string[] = [];
        while (true) {
            const bgFile: string = this.getPartFile(bgArray);
            const personFile: string = this.getPartFile(personsArray);
            const shieldFile: string = this.getPartFile(shielsdArray);
            const helmetFile: string = this.getPartFile(helmetsArray);
            const armFile: string = this.getPartFile(armsArray);

            // Create array from the parts of the final image
            imgArray.push(bgFile);
            imgArray.push(personFile);
            imgArray.push(shieldFile);
            imgArray.push(helmetFile);
            imgArray.push(armFile);

            let imageRarity = this.getRarity();

            let imageName = imgArray.reduce((prev, current) => prev + current) + imageRarity;
            var imageIPFS = await addFileToIPFS(imageName);
            const imageIPFSToString = imageIPFS.toString();

            const outDir = this.getOutDir(tokenImageFile);
            const CREATED_IMAGE_NAME = path.resolve(outDir, imageIPFSToString);

            if (!fs.existsSync(CREATED_IMAGE_NAME + '.png')) {
                this.createMergedImage(DIR_OF_IMAGES, outDir, imgArray, imageIPFSToString);
                break;
            }
        }
    }


    getPartFile(array: string[]): string {
        let key: number = this.getRandomKey(array);
        return array[key];
    }

    getRarity(): string {
        let key: number = this.getRandomKey(Rarity);
        return Rarity[key];
    }

    getOutDir(collectionFile: string): string {
        const tokenImagesDir: string = path.resolve(globals.RESULT_COLLECTION, collectionFile, 'tokenImages');

        if (!fs.existsSync(tokenImagesDir)) {
            fs.mkdirSync(tokenImagesDir);
        }

        return tokenImagesDir;
    }

    getRandomKey(dataSet: object): number {
        const indexArray = Object.keys(dataSet)
            .map(n => Number.parseInt(n))
            .filter(n => !Number.isNaN(n))

        const key: number = Math.floor(Math.random() * indexArray.length);
        return key;
    }

    async createMergedImage(imagesDir: string, outDir: string, imagesArray: string[], fileName: string) {
        //get images paths

        let arrImages: string[] = [];
        imagesArray.forEach(function (part) {
            const imagePart: string = path.join(imagesDir, part);

            arrImages.push(imagePart);
        })
        //get merged image via 'merge-images'/'canvas'
        const b64Data = await mergeImages(arrImages, {
            Canvas: Canvas,
            Image: Image
        });
        //remove data 'headers'
        const rawb64Data = b64Data.replace(/^data:image\/png;base64,/, "");
        //write result to out dir
        const mergedImage = await fs.writeFile(path.resolve(__dirname, path.join(outDir, `${fileName}.png`)), rawb64Data, 'base64', (err) => {
            console.log(err)
        });
    }

}