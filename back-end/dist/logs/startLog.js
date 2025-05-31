"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLog = void 0;
const db_1 = __importDefault(require("../config/db"));
const startLog = async (req, res) => {
    try {
        const { caregiver_id, students } = req.body;
        const moduleRes = await db_1.default.query(`SELECT module_id FROM modules WHERE LOWER(module_name_alias) = 'checkout' LIMIT 1`);
        if (moduleRes.rowCount === 0) {
            res.status(500).json({ error: "Módulo 'checkout' não encontrado." });
            return;
        }
        const module_id = moduleRes.rows[0].module_id;
        const actionRes = await db_1.default.query(`SELECT action_id FROM module_actions WHERE module_id = $1 AND LOWER(action_name) = 'solicitado' LIMIT 1`, [module_id]);
        if (actionRes.rowCount === 0) {
            res.status(500).json({ error: "Ação 'solicitado' não encontrada." });
            return;
        }
        const action_id = actionRes.rows[0].action_id;
        const values = students.map((student_id) => `(${student_id}, ${caregiver_id}, ${module_id}, ${action_id})`).join(", ");
        await db_1.default.query(`
      INSERT INTO logs (log_student_id, log_caregiver_id, log_module_id, log_action_id)
      VALUES ${values}
    `);
        res.status(200).json({ message: "Logs inseridos com sucesso" });
    }
    catch (error) {
        console.error("Erro ao inserir log:", error);
        res.status(500).json({ error: "Erro ao inserir log" });
    }
};
exports.startLog = startLog;
