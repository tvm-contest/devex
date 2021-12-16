import express from 'express';
import { walletSettings } from '../config/walletKey';
import { networks } from '../config/networks';

const router = express.Router();

router.get("/", (req, res) => {
    res.render("settings", {
        walletSettings: walletSettings,
        networkOptions: networks
    })
})

router.post("/", (req, res) => {
    console.log(req.body)
})

export { router as settingsRouter }