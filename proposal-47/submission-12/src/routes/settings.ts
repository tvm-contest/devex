import express from 'express';
import { walletSettings } from '../config/walletKey';
import { networks } from '../config/networks';
import fs from "fs";
import { globals } from '../config/globals';

const router = express.Router();

router.get("/", (req, res) => {
    res.render("settings", {
        walletSettings: walletSettings,
        networkOptions: networks
    })
})

router.post("/", (req, res) => {
   
    
    let settings = JSON.parse(fs.readFileSync(globals.SETTINGS_PATH).toString());
    console.log(settings);
    console.log(req.body);
    let newSettings = { 
                    KEYS :{
                           public: req.body.pubkey,
                           secret: req.body.privatekey
                          },
                    WALLETADDRESS: req.body.walletAddress,
                    NETWORK: req.body.network
                    };            
   fs.writeFileSync(globals.SETTINGS_PATH, JSON.stringify(newSettings));

})

export { router as settingsRouter }