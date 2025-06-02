"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogsByClassHandler = void 0;
const db_1 = __importDefault(require("../config/db"));
const getLogsByClassHandler = async (req, res) => {
    const className = req.query.name;
    try {
        let query = `
      SELECT 
        l.log_id,
        s.student_name_official AS log_student_name,
        c.caregiver_name_official AS log_student_tutor_name,
        sp.spot_name_official AS log_student_class,
        a.action_name AS log_action_type,
        l.log_date_time AS log_timestamp,
        a.action_name AS log_status -- ← pega o status real!
      FROM logs l
      JOIN students s ON l.log_student_id = s.student_id
      JOIN caregivers c ON l.log_caregiver_id = c.caregiver_id
      JOIN spots sp ON s.spot_id = sp.spot_id
      JOIN module_actions a ON l.log_action_id = a.action_id
    `;
        const params = [];
        if (className) {
            query += ` WHERE LOWER(sp.spot_name_official) = $1`;
            params.push(className.toLowerCase());
        }
        query += ` ORDER BY l.log_date_time DESC;`;
        const result = await db_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Erro ao buscar logs da turma:", error);
        res.status(500).json({ error: "Erro ao buscar logs da turma." });
    }
};
exports.getLogsByClassHandler = getLogsByClassHandler;
