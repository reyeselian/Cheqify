import { Request, Response } from "express";
import Cheque from "../models/Cheque";
import DeletedCheque from "../models/DeletedCheque";
import cloudinary from "../config/cloudinary";

// 📋 Listar todos los cheques activos
export const listCheques = async (req: Request, res: Response) => {
  try {
    const cheques = await Cheque.find();
    res.json(cheques);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar cheques" });
  }
};

// 🧾 Crear un nuevo cheque
export const createCheque = async (req: Request, res: Response) => {
  try {
    const {
      numero,
      banco,
      beneficiario,
      monto,
      estado,
      corbata,
      firmadoPor,
      notas,
      fechaCheque,
      fechaDeposito,
    } = req.body;

    // 📸 Si viene una imagen, la URL ya está en req.file.path (Cloudinary)
    const imagen = req.file ? (req.file as any).path : undefined;

    const nuevoCheque = new Cheque({
      numero,
      banco,
      beneficiario,
      monto,
      estado,
      corbata,
      firmadoPor,
      notas,
      fechaCheque,
      fechaDeposito,
      imagen,
    });

    await nuevoCheque.save();
    res.status(201).json(nuevoCheque);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear el cheque" });
  }
};

// 🔍 Obtener un cheque por ID
export const getCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await Cheque.findById(req.params.id);
    if (!cheque)
      return res.status(404).json({ message: "Cheque no encontrado" });

    res.json(cheque);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener el cheque" });
  }
};

// ✏️ Actualizar un cheque por ID
export const updateCheque = async (req: Request, res: Response) => {
  try {
    const {
      numero,
      banco,
      beneficiario,
      monto,
      estado,
      corbata,
      firmadoPor,
      notas,
      fechaCheque,
      fechaDeposito,
    } = req.body;

    const cheque = await Cheque.findById(req.params.id);
    if (!cheque)
      return res.status(404).json({ message: "Cheque no encontrado" });

    // 📸 Si hay nueva imagen, actualiza la URL
    if (req.file) {
      // Elimina la anterior si existía
      if (cheque.imagen) {
        const publicId = extractPublicId(cheque.imagen);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
      cheque.imagen = (req.file as any).path;
    }

    cheque.numero = numero;
    cheque.banco = banco;
    cheque.beneficiario = beneficiario;
    cheque.monto = monto;
    cheque.estado = estado;
    cheque.corbata = corbata;
    cheque.firmadoPor = firmadoPor;
    cheque.notas = notas;
    cheque.fechaCheque = fechaCheque;
    cheque.fechaDeposito = fechaDeposito;

    await cheque.save();
    res.json(cheque);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar el cheque" });
  }
};

// 🗑️ Mover cheque a colección "eliminados"
export const deleteCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await Cheque.findById(req.params.id);
    if (!cheque)
      return res.status(404).json({ message: "Cheque no encontrado" });

    const chequeObj = cheque.toObject ? cheque.toObject() : cheque;

    const deleted = new DeletedCheque({
      ...chequeObj,
      deletedAt: new Date(),
    });

    await deleted.save();
    await cheque.deleteOne();

    res.json({ message: "Cheque movido a Cheques Eliminados" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar el cheque" });
  }
};

// 📜 Listar cheques eliminados
export const listDeletedCheques = async (req: Request, res: Response) => {
  try {
    const deletedCheques = await DeletedCheque.find();
    res.json(deletedCheques);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al listar cheques eliminados" });
  }
};

// 🔄 Restaurar un cheque eliminado
export const restoreCheque = async (req: Request, res: Response) => {
  try {
    const chequeEliminado = await DeletedCheque.findById(req.params.id);
    if (!chequeEliminado)
      return res
        .status(404)
        .json({ message: "Cheque no encontrado en eliminados" });

    const restaurado = new Cheque({
      numero: chequeEliminado.numero,
      banco: chequeEliminado.banco,
      beneficiario: chequeEliminado.beneficiario,
      monto: chequeEliminado.monto,
      estado: chequeEliminado.estado,
      corbata: chequeEliminado.corbata,
      firmadoPor: chequeEliminado.firmadoPor,
      notas: chequeEliminado.notas,
      fechaCheque: chequeEliminado.fechaCheque,
      fechaDeposito: chequeEliminado.fechaDeposito,
      imagen: chequeEliminado.imagen,
    });

    await restaurado.save();
    await chequeEliminado.deleteOne();

    res.json({
      message: "Cheque restaurado correctamente",
      cheque: restaurado,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al restaurar el cheque" });
  }
};

// ❌ Eliminar permanentemente un cheque eliminado (también su imagen en Cloudinary)
export const permanentDeleteCheque = async (req: Request, res: Response) => {
  try {
    const cheque = await DeletedCheque.findById(req.params.id);
    if (!cheque)
      return res.status(404).json({ message: "Cheque no encontrado" });

    // 🧹 Si tiene imagen, eliminarla de Cloudinary
    if (cheque.imagen) {
      const publicId = extractPublicId(cheque.imagen);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    await DeletedCheque.findByIdAndDelete(req.params.id);
    res.json({ message: "Cheque eliminado permanentemente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar permanentemente el cheque" });
  }
};

// 🔍 Extrae el public_id de Cloudinary a partir de la URL
const extractPublicId = (url: string): string | null => {
  try {
    const parts = url.split("/");
    const filename = parts.pop(); // último elemento (ej: abc123.jpg)
    const folder = parts.slice(-2).join("/"); // ej: cheqify/cheques
    return `${folder}/${filename?.split(".")[0]}`; // cheqify/cheques/abc123
  } catch {
    return null;
  }
};
