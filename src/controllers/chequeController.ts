import { Request, Response } from "express";
import Cheque from "../models/Cheque";
import DeletedCheque from "../models/DeletedCheque";
import cloudinary from "../config/cloudinary";

/* =========================================================
   📋 LISTAR CHEQUES ACTIVOS
========================================================= */
export const listCheques = async (_req: Request, res: Response) => {
  try {
    const cheques = await Cheque.find();
    res.json(cheques);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar cheques" });
  }
};

/* =========================================================
   🧾 CREAR NUEVO CHEQUE
========================================================= */
export const createCheque = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const imagen = req.file ? (req.file as any).path : undefined;

    const nuevoCheque = new Cheque({ ...data, imagen });
    await nuevoCheque.save();
    res.status(201).json(nuevoCheque);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear el cheque" });
  }
};

/* =========================================================
   🔍 OBTENER CHEQUE POR ID
========================================================= */
export const getCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await Cheque.findById(req.params.id);
    if (!cheque) return res.status(404).json({ message: "Cheque no encontrado" });
    res.json(cheque);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener el cheque" });
  }
};

/* =========================================================
   ✏️ ACTUALIZAR CHEQUE
========================================================= */
export const updateCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await Cheque.findById(req.params.id);
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
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar el cheque" });
  }
};

/* =========================================================
   🗑️ MOVER A "ELIMINADOS"
========================================================= */
export const deleteCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await Cheque.findById(req.params.id);
    if (!cheque) return res.status(404).json({ message: "Cheque no encontrado" });

    const deleted = new DeletedCheque({
      ...cheque.toObject(),
      deletedAt: new Date(),
    });

    await deleted.save();
    await cheque.deleteOne();

    res.json({ message: "Cheque movido a eliminados" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar el cheque" });
  }
};

/* =========================================================
   📜 LISTAR CHEQUES ELIMINADOS
========================================================= */
export const listDeletedCheques = async (_req: Request, res: Response) => {
  try {
    const deleted = await DeletedCheque.find();
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ message: "Error al listar eliminados" });
  }
};

/* =========================================================
   🔄 RESTAURAR CHEQUE
========================================================= */
export const restoreCheque = async (req: Request, res: Response) => {
  try {
    const deleted = await DeletedCheque.findById(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Cheque no encontrado en eliminados" });

    const restored = new Cheque({ ...deleted.toObject() });
    await restored.save();
    await deleted.deleteOne();

    res.json({ message: "Cheque restaurado correctamente", cheque: restored });
  } catch (err) {
    res.status(500).json({ message: "Error al restaurar el cheque" });
  }
};

/* =========================================================
   ❌ ELIMINAR PERMANENTEMENTE
========================================================= */
export const permanentDeleteCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await DeletedCheque.findById(req.params.id);
    if (!cheque) return res.status(404).json({ message: "Cheque no encontrado" });

    if (cheque.imagen) {
      const publicId = extractPublicId(cheque.imagen);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    await cheque.deleteOne();
    res.json({ message: "Cheque eliminado permanentemente" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar permanentemente" });
  }
};

/* =========================================================
   🧹 AUXILIAR
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
