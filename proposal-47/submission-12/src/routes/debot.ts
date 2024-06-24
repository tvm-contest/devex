import express from 'express';
import { DeployDebotService } from '../services/deployDebot.service';
import { globals } from '../config/globals';

const router = express.Router();

router.get("/", (req, res) => {
    // let debotService = new DeployDebotService();
    // debotService.deployDebot(globals.DEBOT);
    res.render("debot");
})
 
export { router as debotRouter }