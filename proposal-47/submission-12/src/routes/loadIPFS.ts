import { UploadFileToIPFSService } from "../services/uploadFileToIPFS.service";
import fs from 'fs';

const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    var arr_img : string[] = []
    fs.readdirSync("public/image").forEach((file) => {
        arr_img.push(file)
    })
    res.render("loadIPFS",{arr_for_name_img:arr_img})
})

router.post("/fromFolder", async (req, res) => {
    console.log(req.body.name)
    var data = fs.readFileSync(`public/image/${req.body.name}`);
    console.log(data.toString('base64'));
    const uploadService = new UploadFileToIPFSService()
    const link = await uploadService.uploadContent(data.toString('base64'))
    res.json({ link })
})

router.post("/", async (req, res) => {
    const uploadService = new UploadFileToIPFSService()
    const link = await uploadService.uploadContent(req.body.base64)
    res.json({ link })
})


export { router as loadIPFSRouter };