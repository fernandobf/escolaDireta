"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const startLog_1 = require("../logs/startLog");
const getLogs_1 = require("../logs/getLogs");
const getLogsByClassHandler_1 = require("../logs/getLogsByClassHandler");
const updateLogStatusHandler_1 = require("../logs/updateLogStatusHandler");
const router = express_1.default.Router();
// Início do log
router.post("/start", startLog_1.startLog);
// Obtem logs em andamento
router.get("/current", getLogs_1.getCurrentLogs);
// Obtem logs por turma
router.get("/class-logs", getLogsByClassHandler_1.getLogsByClassHandler);
// Atualiza o status de um log
router.put("/:id/status", updateLogStatusHandler_1.updateLogStatusHandler);
exports.default = router;
