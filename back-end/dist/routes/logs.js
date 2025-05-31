"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const startLog_1 = require("../logs/startLog");
const getLogs_1 = require("../logs/getLogs"); // <- novo import
const router = express_1.default.Router();
router.post("/start", startLog_1.startLog);
router.get("/current", getLogs_1.getCurrentLogs); // <- nova rota GET
exports.default = router;
