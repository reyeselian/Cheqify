import { Request, Response } from "express";
import Cheque from "../models/Cheque";
import DeletedCheque from "../models/DeletedCheque";
import cloudinary from "../config/cloudinary";

/* =========================================================
   📋 LISTAR CHEQUES ACTIVOS (solo del usuario autenticado)
========================================================= */
export const listCheques = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const cheques = await Cheque.find({ usuario: userId }).sort({ createdAt: -1 });
    res.json(cheques);
  } catch (err) {
    console.error("Error al listar cheques:", err);
    res.status(500).json({ message: "Error al listar cheques" });
  }
};

/* =========================================================
   🧾 CREAR NUEVO CHEQUE
========================================================= */
export const createCheque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user || {};
    const userId = user.id;

    const empresaNombre = user.empresa || "";
    const companyFallback = user.company ? String(user.company) : "";
    const companyValue = empresaNombre || companyFallback || "Sin empresa";

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // ⬇️ Ignoramos cualquier fechaCheque enviada desde el frontend
    const { fechaCheque, ...data } = req.body;

    const imagen = req.file ? (req.file as any).path : undefined;

    const nuevoCheque = new Cheque({
      ...data,
      fechaCheque: new Date(),  // 🕒 siempre la fecha/hora actual del servidor
      usuario: userId,
      company: companyValue,
      imagen,
    });

    await nuevoCheque.save();

    res.status(201).json(nuevoCheque);
  } catch (err: any) {
    console.error("Error al crear cheque:", err);
    res
      .status(500)
      .json({ message: "Error al crear el cheque", error: err.message });
  }
};


/* =========================================================
   🔍 OBTENER CHEQUE POR ID
========================================================= */
export const getCheque = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const cheque = await Cheque.findOne({ _id: req.params.id, usuario: userId });

    if (!cheque) {
      return res.status(404).json({ message: "Cheque no encontrado" });
    }

    res.json(cheque);
  } catch (err) {
    console.error("Error al obtener cheque:", err);
    res.status(500).json({ message: "Error al obtener cheque" });
  }
};

/* =========================================================
   ✏️ ACTUALIZAR CHEQUE
========================================================= */
export const updateCheque = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const cheque = await Cheque.findOne({ _id: req.params.id, usuario: userId });
    if (!cheque) return res.status(404).json({ message: "Cheque no encontrado" });

    if (req.file) {
      if (cheque.imagen) {
        const publicId = extractPublicId(cheque.imagen);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      cheque.imagen = (req.file as any).path;
    }

    Object.assign(cheque, req.body);
    await cheque.save();

    res.json(cheque);
  } catch (err: any) {
    console.error("Error al actualizar cheque:", err);
    res.status(500).json({ message: "Error al actualizar el cheque", error: err.message });
  }
};

/* =========================================================
   🗑️ MOVER A ELIMINADOS (SOFT DELETE)
========================================================= */
export const deleteCheque = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const cheque = await Cheque.findOne({ _id: req.params.id, usuario: userId });

    if (!cheque) {
      return res.status(404).json({ message: "Cheque no encontrado" });
    }

    const deleted = new DeletedCheque({
      ...cheque.toObject(),
      usuario: userId,
      deletedAt: new Date(),
    });

    await deleted.save();
    await cheque.deleteOne();

    res.json({ message: "Cheque movido a eliminados correctamente" });
  } catch (err) {
    console.error("Error al eliminar cheque:", err);
    res.status(500).json({ message: "Error al eliminar el cheque" });
  }
};

/* =========================================================
   🔄 RESTAURAR CHEQUE (ÚNICO LUGAR MODIFICADO)
========================================================= */
export const restoreCheque = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user || {};
    const userId = user.id;

    const empresaNombre = user.empresa || "";
    const companyFallback = user.company ? String(user.company) : "";
    const companyValue = empresaNombre || companyFallback || "Sin empresa";

    const deleted = await DeletedCheque.findOne({
      _id: req.params.id,
      usuario: userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Cheque no encontrado en eliminados" });
    }

    const restored = new Cheque({
      ...deleted.toObject(),
      usuario: userId,
      company: companyValue,      // ← NECESARIO PARA EVITAR EL ERROR
      restoredAt: new Date(),
    });

    await restored.save();
    await deleted.deleteOne();

    res.json({ message: "Cheque restaurado correctamente", cheque: restored });
  } catch (err) {
    console.error("Error al restaurar cheque:", err);
    res.status(500).json({ message: "Error al restaurar el cheque" });
  }
};

/* =========================================================
   📜 LISTAR CHEQUES ELIMINADOS
========================================================= */
export const listDeletedCheques = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    console.log("🧠 Solicitud para listar cheques eliminados");

    if (!userId) {
      console.log("🚨 No se recibió ID de usuario desde el token");
      return res.status(401).json({ message: "Token inválido o no autenticado" });
    }

    console.log("👤 Usuario autenticado ID:", userId);

    const deletedCheques = await DeletedCheque.find({ usuario: userId }).sort({
      deletedAt: -1,
    });

    console.log("📄 Cheques eliminados encontrados:", deletedCheques.length);

    if (deletedCheques.length > 0) {
      console.log("🔹 Ejemplo primer cheque eliminado:", deletedCheques[0]);
    } else {
      console.log("⚠️ No hay cheques eliminados registrados en la base de datos.");
    }

    return res.json(deletedCheques);
  } catch (err) {
    console.error("❌ Error al listar cheques eliminados:", err);
    return res.status(500).json({ message: "Error al listar cheques eliminados" });
  }
};

/* =========================================================
   ❌ ELIMINAR PERMANENTEMENTE
========================================================= */
export const permanentDeleteCheque = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const cheque = await DeletedCheque.findOne({
      _id: req.params.id,
      usuario: userId,
    });

    if (!cheque) {
      return res.status(404).json({ message: "Cheque no encontrado" });
    }

    if (cheque.imagen) {
      const publicId = extractPublicId(cheque.imagen);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    await cheque.deleteOne();
    res.json({ message: "Cheque eliminado permanentemente" });
  } catch (err) {
    console.error("Error al eliminar permanentemente cheque:", err);
    res.status(500).json({
      message: "Error al eliminar permanentemente el cheque",
    });
  }
};

/* =========================================================
   🧹 AUXILIAR: Extraer public_id de Cloudinary
========================================================= */
const extractPublicId = (url: string): string | null => {
  try {
    const parts = url.split("/");
    const filename = parts.pop();
    const folder = parts.slice(-2).join("/");
    return `${folder}/${filename?.split(".")[0]}`;
  } catch {
    return null;
  }
};
