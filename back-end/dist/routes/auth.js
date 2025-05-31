"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const login_1 = __importDefault(require("../controllers/auth/login"));
const validateToken_1 = __importDefault(require("../controllers/auth/validateToken")); // <- default import
const router = express_1.default.Router();
router.post("/login", login_1.default);
router.post("/validate-token", validateToken_1.default);
exports.default = router;
