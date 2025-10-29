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

// 📸 Configuración de almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => {
    return {
      folder: "cheqify/cheques", // ✅ Tipado correcto
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image",
    } as any; // 👈 Forzamos tipo porque TS no incluye 'folder' aún
  },
});

const upload = multer({ storage });

// 📍 Rutas principales
router.get("/", listCheques);
router.post("/", upload.single("imagen"), createCheque);
router.get("/:id", getCheque);
router.put("/:id", upload.single("imagen"), updateCheque);
router.delete("/:id", deleteCheque);

// 📦 Rutas de cheques eliminados
router.get("/deleted/all", listDeletedCheques);
router.put("/restore/:id", restoreCheque);
router.delete("/permanent/:id", permanentDeleteCheque);

export default router;
