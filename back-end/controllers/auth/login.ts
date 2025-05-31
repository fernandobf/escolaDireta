// controllers/auth/login.ts
import { Request, Response } from "express";
import pool from "../../config/db";

export default async function loginHandler(req: Request, res: Response): Promise<void> {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({ error: "Telefone não informado." });
    return;
  }

  try {
    // Busca o responsável
    const caregiverResult = await pool.query(
      `SELECT caregiver_id, caregiver_name_official 
       FROM caregivers 
       WHERE caregiver_phone = $1 AND is_active = true`,
      [phone]
    );

    if (caregiverResult.rows.length === 0) {
      res.status(404).json({ error: "Responsável não encontrado." });
      return;
    }

    const caregiver = caregiverResult.rows[0];

    // Busca os alunos associados a esse responsável
    const studentsResult = await pool.query(
      `SELECT 
         s.student_id,
         s.student_name_official,
         sp.spot_name_official
       FROM students_caregivers sc
       JOIN students s ON sc.student_id = s.student_id
       JOIN spots sp ON s.spot_id = sp.spot_id
       WHERE sc.caregiver_id = $1 AND s.is_active = true`,
      [caregiver.caregiver_id]
    );

    // Retorna os dados formatados
    res.json({
      caregiver_id: caregiver.caregiver_id,
      caregiver_name: caregiver.caregiver_name_official,
      students: studentsResult.rows,
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
}
