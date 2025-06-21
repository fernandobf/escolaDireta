import { Request, Response } from "express";
import pool from "../config/db";

export const getLogsByClassHandler = async (req: Request, res: Response): Promise<void> => {
  const className = req.query.name as string | undefined;

  try {
    
    let query = `
      SELECT 
        l.log_id,
        s.student_id AS log_student_id,
        s.student_name_official AS log_student_name,
        c.caregiver_name_official AS log_student_tutor_name,
        sp.spot_name_official AS log_student_class,
        a.action_name AS log_action_type,
        l.log_date_time AS log_timestamp,
        a.action_name AS log_status -- ← pega o status real!
      FROM checkout.logs l
      JOIN checkout.students s ON l.log_student_id = s.student_id
      JOIN checkout.caregivers c ON l.log_caregiver_id = c.caregiver_id
      JOIN checkout.spots sp ON s.spot_id = sp.spot_id
      JOIN checkout.module_actions a ON l.log_action_id = a.action_id
    `;

    const params: any[] = [];

    if (className) {
      query += ` WHERE LOWER(sp.spot_name_official) = $1`;
      params.push(className.toLowerCase());
    }

    query += ` ORDER BY l.log_date_time DESC;`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar logs da turma:", error);
    res.status(500).json({ error: "Erro ao buscar logs da turma." });
  }
};
