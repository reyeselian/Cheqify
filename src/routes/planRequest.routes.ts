// src/routes/planRequest.routes.ts
import { Router } from "express";
import {
  createPlanRequest,
  listPlanRequests,
  updatePlanRequestStatus,
} from "../controllers/PlanRequestController";

const router = Router();

// Usuario — crear solicitud
router.post("/", createPlanRequest);

// Admin — listar y actualizar
router.get("/admin",      listPlanRequests);
router.patch("/admin/:id", updatePlanRequestStatus);

export default router;