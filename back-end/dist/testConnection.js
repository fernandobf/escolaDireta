"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// back-end/testConnection.ts
const db_1 = __importDefault(require("./config/db"));
(async () => {
    try {
        const result = await db_1.default.query("SELECT NOW()");
        console.log("✅ Conexão bem-sucedida:", result.rows[0]);
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Erro ao conectar ao banco:", error);
        process.exit(1);
    }
})();
