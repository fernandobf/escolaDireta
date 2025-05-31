import express from "express";
import { startLog } from "../logs/startLog";
import { getCurrentLogs } from "../logs/getLogs"; // <- novo import

const router = express.Router();

router.post("/start", startLog);
router.get("/current", getCurrentLogs); // <- nova rota GET

export default router;
