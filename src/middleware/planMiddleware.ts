// src/middlewares/planMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

// ─────────────────────────────────────────────────────────────
// Tipos de estado de cuenta
// ─────────────────────────────────────────────────────────────
export type AccountStatus =
  | "trial"            // en período de prueba
  | "trial_expired"    // prueba vencida → bloquear
  | "active"           // plan de pago activo
  | "payment_required" // plan de pago vencido → página de pago
  | "blocked";         // bloqueado manualmente por admin

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Calcula la fecha de expiración a partir del día de registro.
 * Siempre se cuenta desde registeredAt, no desde el día del pago.
 *
 * @param registeredAt  Fecha original de registro
 * @param cycleNumber   Número de ciclo (1 = primer mes/año, 2 = segundo, etc.)
 * @param durationDays  30 para mensual, 365 para anual
 */
export const calcExpiresAt = (
  registeredAt: Date,
  cycleNumber: number,
  durationDays: number
): Date => {
  const base = new Date(registeredAt);
  base.setDate(base.getDate() + durationDays * cycleNumber);
  return base;
};

/**
 * Calcula el estado actual de la cuenta según las fechas y el plan.
 */
export const resolveAccountStatus = (user: any): AccountStatus => {
  const now = new Date();

  // Bloqueado manualmente
  if (user.status === "blocked") return "blocked";

  const plan = user.plan as "trial" | "monthly" | "annual";

  if (plan === "trial") {
    // Expiración = registeredAt + trialDays del plan
    const trialDays: number = user.trialDays ?? 14;
    const trialExpires = new Date(user.registeredAt);
    trialExpires.setDate(trialExpires.getDate() + trialDays);

    return now <= trialExpires ? "trial" : "trial_expired";
  }

  // Plan de pago (monthly / annual)
  // planExpiresAt se actualiza cada vez que el admin aprueba un pago
  if (!user.planExpiresAt) return "payment_required";

  return now <= new Date(user.planExpiresAt) ? "active" : "payment_required";
};

// ─────────────────────────────────────────────────────────────
// checkPlanActive
// Middleware principal — se coloca en todas las rutas protegidas
// después de verifyToken.
//
// Uso:
//   router.get("/cheques", verifyToken, checkPlanActive, getCheques);
// ─────────────────────────────────────────────────────────────
export const checkPlanActive = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // verifyToken debe haber puesto el id del usuario en req.user
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "No autorizado" });
      return;
    }

    const user = await User.findById(userId).select(
      "plan trialDays registeredAt planExpiresAt status"
    );

    if (!user) {
      res.status(404).json({ success: false, message: "Usuario no encontrado" });
      return;
    }

    const accountStatus = resolveAccountStatus(user);

    // Permitir acceso
    if (accountStatus === "trial" || accountStatus === "active") {
      // Adjunta el estado al request para usarlo en los controllers si se necesita
      (req as any).accountStatus = accountStatus;
      next();
      return;
    }

    // Bloquear: prueba vencida
    if (accountStatus === "trial_expired") {
      res.status(403).json({
        success: false,
        code: "TRIAL_EXPIRED",
        message: "Tu período de prueba ha vencido. Elige un plan para continuar.",
        redirectTo: "/planes",
      });
      return;
    }

    // Bloquear: pago requerido
    if (accountStatus === "payment_required") {
      res.status(403).json({
        success: false,
        code: "PAYMENT_REQUIRED",
        message: "Tu plan ha vencido. Realiza el pago para continuar.",
        redirectTo: "/pago",
      });
      return;
    }

    // Bloqueado manualmente
    res.status(403).json({
      success: false,
      code: "ACCOUNT_BLOCKED",
      message: "Tu cuenta ha sido bloqueada. Contacta al administrador.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al verificar el plan" });
  }
};

// ─────────────────────────────────────────────────────────────
// activatePayment  (llamado por el admin al aprobar un pago)
// Recalcula planExpiresAt partiendo siempre de registeredAt.
//
// Uso en adminController:
//   import { activatePayment } from "../middlewares/planMiddleware";
//   await activatePayment(userId);
// ─────────────────────────────────────────────────────────────
export const activatePayment = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select(
    "plan registeredAt planExpiresAt planCycle"
  );

  if (!user) throw new Error("Usuario no encontrado");
  if (user.plan === "trial") throw new Error("El plan de prueba no requiere pago");

  const durationDays = user.plan === "annual" ? 365 : 30;

  // Determina el próximo ciclo (evita solapar con un ciclo activo)
  const now = new Date();
  let cycle: number = user.planCycle ?? 0;

  // Si el plan actual aún no venció, el nuevo ciclo va encima del actual
  if (user.planExpiresAt && new Date(user.planExpiresAt) > now) {
    cycle += 1;
  } else {
    // Si ya venció, calcula cuántos ciclos han pasado desde el registro
    const msPassed = now.getTime() - new Date(user.registeredAt).getTime();
    const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
    cycle = Math.floor(daysPassed / durationDays) + 1;
  }

  const newExpires = calcExpiresAt(user.registeredAt, cycle, durationDays);

  await User.findByIdAndUpdate(userId, {
    status: "active",
    planExpiresAt: newExpires,
    planCycle: cycle,
  });
};