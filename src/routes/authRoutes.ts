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
  getMe,
} from "../controllers/Auth";

const router = Router();

router.post("/register",             registerUser);
router.post("/login",                loginUser);
router.post("/verify-password",      verifyPassword);
router.patch("/update",              updateUser);
router.patch("/change-password",     changePassword);
router.get("/me",                    getMe);

// ── Verificación de email ─────────────────────────────────
router.get("/verify-email/:token",   verifyEmail);
router.post("/resend-verification",  resendVerificationEmail);

export default router;