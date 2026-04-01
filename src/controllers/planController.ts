// src/controllers/planController.ts

import { Request, Response } from "express";
import Plan, { IPlan } from "../models/Plan";

// ─────────────────────────────────────────────
// GET /api/plans
// Retorna todos los planes activos (público, para el registro)
// ─────────────────────────────────────────────
export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener los planes" });
  }
};

// ─────────────────────────────────────────────
// GET /api/plans/all  (admin)
// Retorna todos los planes incluyendo inactivos
// ─────────────────────────────────────────────
export const getAllPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener los planes" });
  }
};

// ─────────────────────────────────────────────
// GET /api/plans/:id  (admin)
// Retorna un plan por ID
// ─────────────────────────────────────────────
export const getPlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, message: "Plan no encontrado" });
      return;
    }
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al obtener el plan" });
  }
};

// ─────────────────────────────────────────────
// POST /api/plans  (admin)
// Crear un nuevo plan
// ─────────────────────────────────────────────
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, price, durationDays, trialDays, description, features } = req.body;

    const exists = await Plan.findOne({ type });
    if (exists) {
      res.status(400).json({ success: false, message: `Ya existe un plan de tipo '${type}'` });
      return;
    }

    const plan = await Plan.create({
      name,
      type,
      price: price ?? 0,
      durationDays: durationDays ?? 0,
      trialDays: trialDays ?? 0,
      description: description ?? "",
      features: features ?? [],
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al crear el plan" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/plans/:id  (admin)
// Actualizar un plan existente
// ─────────────────────────────────────────────
export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, durationDays, trialDays, description, features, isActive } = req.body;

    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, price, durationDays, trialDays, description, features, isActive },
      { new: true, runValidators: true }
    );

    if (!plan) {
      res.status(404).json({ success: false, message: "Plan no encontrado" });
      return;
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al actualizar el plan" });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/plans/:id  (admin)
// Desactivar un plan (soft delete)
// ─────────────────────────────────────────────
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!plan) {
      res.status(404).json({ success: false, message: "Plan no encontrado" });
      return;
    }

    res.json({ success: true, message: "Plan desactivado correctamente", data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al eliminar el plan" });
  }
};

// ─────────────────────────────────────────────
// POST /api/plans/seed  (admin / solo en desarrollo)
// Inserta los 3 planes base si no existen
// ─────────────────────────────────────────────
export const seedPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const defaultPlans = [
      {
        name: "Prueba",
        type: "trial",
        price: 0,
        durationDays: 0,
        trialDays: 14,
        description: "Explora Cheqify sin compromiso",
        features: [
          "14 días gratis",
          "Acceso completo al sistema",
          "Gestión de cheques",
          "Soporte por email",
        ],
      },
      {
        name: "Mensual",
        type: "monthly",
        price: 29,
        durationDays: 30,
        trialDays: 0,
        description: "Ideal para empresas en crecimiento",
        features: [
          "Renovación cada 30 días",
          "Acceso completo al sistema",
          "Gestión ilimitada de cheques",
          "Reportes y estadísticas",
          "Soporte prioritario",
        ],
      },
      {
        name: "Anual",
        type: "annual",
        price: 290,
        durationDays: 365,
        trialDays: 0,
        description: "El mejor valor para tu empresa",
        features: [
          "2 meses gratis incluidos",
          "Acceso completo al sistema",
          "Gestión ilimitada de cheques",
          "Reportes avanzados",
          "Soporte 24/7 prioritario",
          "Historial completo",
        ],
      },
    ];

    const results = [];
    for (const p of defaultPlans) {
      const exists = await Plan.findOne({ type: p.type });
      if (!exists) {
        const created = await Plan.create(p);
        results.push(created);
      }
    }

    res.json({
      success: true,
      message: `${results.length} plan(es) creado(s)`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al sembrar los planes" });
  }
};