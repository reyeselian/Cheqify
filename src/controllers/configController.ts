// src/controllers/configController.ts
import { Request, Response } from "express";
import { Configuracion } from "../models/Configuracion";

export const getConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    let config = await Configuracion.findOne({ user: userId });
    if (!config) {
      config = await Configuracion.create({ user: userId });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener configuración", error });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = req.body;

    const updated = await Configuracion.findOneAndUpdate(
      { user: userId },
      data,
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error al guardar configuración", error });
  }
};
