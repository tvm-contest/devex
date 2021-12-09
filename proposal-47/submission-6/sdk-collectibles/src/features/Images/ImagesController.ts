import { JsonController, Post, UploadedFile } from 'routing-controllers';
import { Service } from 'typedi';
import path from "path";
import fs from "fs";
import multer from "multer";
import mime from 'mime-types';
import { PinataService } from "../Pinata/PinataService";

const imageUploadOptions = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const filepath = path.resolve(__dirname, `../../../public/image/${new Date().toISOString()}`);
      fs.mkdirSync(filepath, { recursive: true });

      return cb(null, filepath);
    },
    filename: (req, file, cb) => {
      const extension = mime.extension(file.mimetype);

      return cb(null, `index.${extension}`);
    }
  }),
};

@JsonController('/images')
@Service()
export class ImagesController {
    private readonly PinataService: PinataService;
    constructor() {
      this.PinataService = new PinataService();
    }

    @Post('/upload')
    public async upload(
        @UploadedFile('image', { options: imageUploadOptions })
          image: Express.Multer.File
    ) {
      try {
        const res = await this.PinataService.uploadFile(image);
        console.log(`Image with hash ${res.IpfsHash} is saved`);
        return {
          hash: res.IpfsHash,
          mimetype: image.mimetype,
          size: image.size
        };
        // eslint-disable-next-line no-useless-catch
      } catch (e) {
        throw e;
      } finally {
        await fs.promises.rm(image.path);
      }
    }
}
