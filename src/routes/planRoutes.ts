// src/routes/planRoutes.ts

import { Router } from "express";
import {
  getPlans,
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  seedPlans,
} from "../controllers/planController";

// Importa tus middlewares de autenticación y rol admin
// import { verifyToken } from "../middlewares/authMiddleware";
// import { isAdmin }     from "../middlewares/roleMiddleware";

const router = Router();

// ─── Rutas públicas ───────────────────────────────────────────
// Usadas por el frontend en el formulario de registro
router.get("/", getPlans);                          // GET  /api/plans

// ─── Rutas de administrador ───────────────────────────────────
// Descomenta los middlewares cuando tengas auth implementada
router.get(   "/all",      /* verifyToken, isAdmin, */ getAllPlans);   // GET    /api/plans/all
router.get(   "/:id",      /* verifyToken, isAdmin, */ getPlanById);   // GET    /api/plans/:id
router.post(  "/",         /* verifyToken, isAdmin, */ createPlan);    // POST   /api/plans
router.put(   "/:id",      /* verifyToken, isAdmin, */ updatePlan);    // PUT    /api/plans/:id
router.delete("/:id",      /* verifyToken, isAdmin, */ deletePlan);    // DELETE /api/plans/:id

// ─── Seed (solo desarrollo) ───────────────────────────────────
// Llama una vez para insertar los 3 planes base en la BD
router.post("/seed",       /* verifyToken, isAdmin, */ seedPlans);     // POST   /api/plans/seed

export default router;