import express from "express";
import loginHandler from "../controllers/auth/login";
import validateToken from "../controllers/auth/validateToken"; // <- default import

const router = express.Router();

router.post("/login", loginHandler);
router.post("/validate-token", validateToken);

export default router;
