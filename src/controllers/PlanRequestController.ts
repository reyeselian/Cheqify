// src/controllers/PlanRequestController.ts
import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import PlanRequest from "../models/PlanRequest";
import { sendPlanRequestEmail, sendPlanRequestConfirmEmail } from "../services/Emailservice";

/* =========================================================
   📝 CREAR SOLICITUD (usuario)
   POST /api/plan-requests
========================================================= */
export const createPlanRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" }); return;
    }
    const decoded = jwt.verify(
      authHeader.split(" ")[1],
      process.env.JWT_SECRET as Secret
    ) as { id: string };

    const { empresa, email, planActual, planSolicitado } = req.body;
    if (!empresa || !email || !planActual || !planSolicitado) {
      res.status(400).json({ message: "Faltan campos obligatorios" }); return;
    }

    // Evitar solicitudes duplicadas pendientes
    const existing = await PlanRequest.findOne({ userId: decoded.id, status: "pendiente" });
    if (existing) {
      res.status(400).json({ message: "Ya tienes una solicitud pendiente. Te contactaremos pronto." });
      return;
    }

    const request = await PlanRequest.create({
      userId: decoded.id,
      empresa,
      email,
      planActual,
      planSolicitado,
    });

    // Enviar emails en paralelo — no bloqueamos si falla
    await Promise.allSettled([
      sendPlanRequestEmail(empresa, email, planActual, planSolicitado),
      sendPlanRequestConfirmEmail(email, empresa, planSolicitado),
    ]);

    res.status(201).json({ message: "Solicitud enviada correctamente.", request });
  } catch (error) {
    console.error("Error en createPlanRequest:", error);
    res.status(500).json({ message: "Error al crear la solicitud" });
  }
};

/* =========================================================
   📋 LISTAR SOLICITUDES (admin)
   GET /api/plan-requests/admin
========================================================= */
export const listPlanRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string;

    const filter: any = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      PlanRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      PlanRequest.countDocuments(filter),
    ]);

    res.json({ requests, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener solicitudes" });
  }
};

/* =========================================================
   ✏️ ACTUALIZAR STATUS (admin)
   PATCH /api/plan-requests/admin/:id
========================================================= */
export const updatePlanRequestStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notas } = req.body;
    const allowed = ["pendiente", "contactado", "completado", "rechazado"];
    if (!allowed.includes(status)) {
      res.status(400).json({ message: "Estado inválido" }); return;
    }

    const request = await PlanRequest.findByIdAndUpdate(
      req.params.id,
      { status, ...(notas !== undefined && { notas }) },
      { new: true }
    );
    if (!request) { res.status(404).json({ message: "Solicitud no encontrada" }); return; }

    res.json({ message: "Solicitud actualizada", request });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar solicitud" });
  }
};