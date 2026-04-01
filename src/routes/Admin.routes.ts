// src/routes/Admin.routes.ts
import { Router } from "express";
import {
  adminLogin,
  getDashboardStats,
  listUsers,
  getUserById,
  updateUser,
  toggleBlockUser,
  deleteUser,
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminTogglePlan,
  getIngresos,
  setPrecioPersonalizado,
} from "../controllers/Admincontroller";
import { requireAdmin } from "../middleware/Adminmiddleware";

const router = Router();

// ── Auth (pública) ───────────────────────────────────────────
router.post("/login", adminLogin);

// ── A partir de aquí todo requiere requireAdmin ──────────────
router.use(requireAdmin);

// Dashboard
router.get("/stats", getDashboardStats);

// Ingresos
router.get("/ingresos", getIngresos);

// Usuarios
router.get("/users",                    listUsers);
router.get("/users/:id",                getUserById);
router.patch("/users/:id",              updateUser);
router.patch("/users/:id/block",        toggleBlockUser);
router.patch("/users/:id/precio",       setPrecioPersonalizado);
router.delete("/users/:id",             deleteUser);

// Planes
router.get("/plans",              adminGetPlans);
router.post("/plans",             adminCreatePlan);
router.put("/plans/:id",          adminUpdatePlan);
router.patch("/plans/:id/toggle", adminTogglePlan);

export default router;