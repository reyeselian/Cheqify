// src/routes/auth.routes.ts
import { Router } from "express";
import {
  registerUser,
  loginUser,
  verifyPassword,
  updateUser,
  changePassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/Auth";

const router = Router();

router.post("/register",                    registerUser);
router.post("/login",                       loginUser);
router.post("/verify-password",             verifyPassword);
router.patch("/update",                     updateUser);
router.patch("/change-password",            changePassword);

// ── Verificación de email ─────────────────────────────────
router.get("/verify-email/:token",          verifyEmail);
router.post("/resend-verification",         resendVerificationEmail);

export default router;