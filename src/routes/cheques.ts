import { Router } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
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

const router = Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "cheqify/cheques",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  }) as any,
});
const upload = multer({ storage });

// 📦 Rutas eliminados
router.get("/deleted/all", listDeletedCheques);
router.put("/restore/:id", restoreCheque);
router.delete("/permanent/:id", permanentDeleteCheque);

// 📋 Rutas principales
router.get("/", listCheques);
router.post("/", upload.single("imagen"), createCheque);
router.put("/:id", upload.single("imagen"), updateCheque);
router.get("/:id", getCheque);
router.delete("/:id", deleteCheque);

export default router;
