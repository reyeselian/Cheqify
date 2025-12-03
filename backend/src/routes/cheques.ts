import express from "express";
import {
  listCheques,
  createCheque,
  getCheque,
  updateCheque,
  deleteCheque,
  listDeletedCheques,
  restoreCheque,
  permanentDeleteCheque,
} from "../controllers/chequeController";
import { protect } from "../middleware/authMiddleware";
import upload from "../middleware/multer";

const router = express.Router();

// ✅ Todas las rutas protegidas
router.get("/", protect, listCheques);
router.post("/", protect, upload.single("imagen"), createCheque);

// ⚠️ Estas rutas específicas deben ir ANTES de "/:id"
router.get("/deleted/all", protect, listDeletedCheques);
router.put("/restore/:id", protect, restoreCheque);
router.delete("/permanent/:id", protect, permanentDeleteCheque);

// 🧾 CRUD principal
router.get("/:id", protect, getCheque);
router.put("/:id", protect, upload.single("imagen"), updateCheque);
router.delete("/:id", protect, deleteCheque);

export default router;
