// src/routes/configRoutes.ts
import express from "express";
import { getConfig, updateConfig } from "../controllers/configController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, getConfig);
router.put("/", protect, updateConfig);

export default router;
