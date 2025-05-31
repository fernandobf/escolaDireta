import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export default async function validateToken(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ valid: false, message: "Token ausente." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET || "fallback_secret");
    res.json({ valid: true, clientId: (decoded as any).clientId });
  } catch (err) {
    res.status(401).json({ valid: false, message: "Token inválido." });
  }
}
