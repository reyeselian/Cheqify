import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

// 🔹 Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "cheqify/cheques", // 📂 Carpeta en Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
  }),
});

// 🔹 Validar tipo de archivo
const fileFilter = (req: any, file: Express.Multer.File, cb: Function) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de archivo no soportado. Usa JPG, PNG o WEBP."), false);
  }
};

// 🔹 Middleware final
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Máx. 5 MB
});

export default upload;
