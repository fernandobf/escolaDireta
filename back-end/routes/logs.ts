import express from "express";
import { startLog } from "../logs/startLog";
import { getCurrentLogs } from "../logs/getLogs";
import { getLogsByClassHandler } from "../logs/getLogsByClassHandler";
import { updateLogStatusHandler } from "../logs/updateLogStatusHandler";

const router = express.Router();

// Início do log
router.post("/start", startLog);

// Obtem logs em andamento
router.get("/current", getCurrentLogs);

// Obtem logs por turma
router.get("/class-logs", getLogsByClassHandler);

// Atualiza o status de um log
router.put("/:id/status", updateLogStatusHandler);

export default router;
