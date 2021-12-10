import { UploadFileToIPFSService } from "../services/uploadFileToIPFS.service";

const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.render("loadIPFS")
})

router.post("/", async (req, res) => {
    const uploadService = new UploadFileToIPFSService()
    const link = await uploadService.uploadContent(req.body.base64)
    res.json({ link })
})

export { router as loadIPFSRouter };