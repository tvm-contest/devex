import express from 'express';
import { TokenImagesCreator } from '../services/gen-images.service';
const router = express.Router();

router.get('/', async function (req, res, next) {
    try {
        const imagesCreator = new TokenImagesCreator();
        for (let index = 0; index < 100; index++) {
            await imagesCreator.createImage();
        }
        res.send('Image is generated!');
    } catch (error) {
        console.log(error)
    }
});

export { router as imageGen };