// src/controllers/auth.ts

import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import mongoose, { Document } from "mongoose";
import crypto from "crypto";
import { User } from "../models/User";
import Plan from "../models/Plan";
import { sendVerificationEmail } from "../services/Emailservice";

/* =========================================================
   🧩 INTERFAZ
========================================================= */
interface IUserDoc extends Document {
  _id: string;
  empresa: string;
  email: string;
  password: string;
  plan: string;
  planRef: mongoose.Types.ObjectId;
  status: string;
  trialDays: number;
  registeredAt: Date;
  planExpiresAt: Date | null;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

/* =========================================================
   🔑 GENERAR TOKEN JWT
========================================================= */
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no definido en el entorno");
  return jwt.sign({ id }, secret as Secret, { expiresIn: "7d" });
};

/* =========================================================
   📝 REGISTRO
========================================================= */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresa, email, password, plan: planType, planId } = req.body;

    if (!empresa || !email || !password) {
      res.status(400).json({ message: "Todos los campos son obligatorios" });
      return;
    }

    if (!planType || !["trial", "monthly", "annual"].includes(planType)) {
      res.status(400).json({ message: "Debes seleccionar un plan válido" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "El correo ya está registrado" });
      return;
    }

    const planDoc = planId
      ? await Plan.findById(planId)
      : await Plan.findOne({ type: planType, isActive: true });

    if (!planDoc) {
      res.status(400).json({ message: "El plan seleccionado no existe o no está disponible" });
      return;
    }

    const status = planType === "trial" ? "trial" : "payment_required";

    // ── Generar token de verificación ─────────────────────
    const verificationToken   = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = (await User.create({
      empresa,
      email,
      password,
      planRef: planDoc._id,
      plan: planType,
      trialDays: planDoc.trialDays ?? 14,
      registeredAt: new Date(),
      planExpiresAt: null,
      planCycle: 0,
      status,
      isEmailVerified:          false,
      emailVerificationToken:   verificationToken,
      emailVerificationExpires: verificationExpires,
    })) as unknown as IUserDoc;

    // ── Enviar email de verificación ──────────────────────
    try {
      await sendVerificationEmail(user.email, user.empresa, verificationToken);
    } catch (emailError) {
      console.error("Error al enviar email de verificación:", emailError);
      // No bloqueamos el registro si falla el email, pero lo logueamos
    }

    res.status(201).json({
      message: "Cuenta creada. Revisa tu correo para verificar tu cuenta antes de iniciar sesión.",
      email: user.email,
    });

  } catch (error) {
    console.error("Error en registro:", error);
    const err = error as Error;
    res.status(500).json({ message: "Error en el registro", error: err.message });
  }
};

/* =========================================================
   ✅ VERIFICAR EMAIL
========================================================= */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({ message: "Token de verificación no proporcionado" });
      return;
    }

    const user = await User.findOne({
      emailVerificationToken:   token,
      emailVerificationExpires: { $gt: new Date() }, // que no haya expirado
    }) as unknown as IUserDoc | null;

    if (!user) {
      res.status(400).json({
        message: "El enlace de verificación es inválido o ha expirado. Solicita uno nuevo.",
      });
      return;
    }

    // ── Marcar como verificado ────────────────────────────
    user.isEmailVerified          = true;
    user.emailVerificationToken   = null;
    user.emailVerificationExpires = null;
    await (user as any).save();

    res.status(200).json({
      message: "✅ Correo verificado correctamente. Ya puedes iniciar sesión.",
    });

  } catch (error) {
    console.error("Error en verifyEmail:", error);
    res.status(500).json({ message: "Error al verificar el correo" });
  }
};

/* =========================================================
   🔁 REENVIAR EMAIL DE VERIFICACIÓN
========================================================= */
export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "El correo es obligatorio" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }) as unknown as IUserDoc | null;

    // Respuesta genérica por seguridad (no revelar si el email existe)
    if (!user) {
      res.status(200).json({ message: "Si el correo existe, recibirás un nuevo enlace de verificación." });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400).json({ message: "Este correo ya fue verificado." });
      return;
    }

    // ── Generar nuevo token ───────────────────────────────
    const newToken   = crypto.randomBytes(32).toString("hex");
    const newExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken   = newToken;
    user.emailVerificationExpires = newExpires;
    await (user as any).save();

    await sendVerificationEmail(user.email, user.empresa, newToken);

    res.status(200).json({ message: "Se ha enviado un nuevo enlace de verificación a tu correo." });

  } catch (error) {
    console.error("Error en resendVerificationEmail:", error);
    res.status(500).json({ message: "Error al reenviar el correo de verificación" });
  }
};

/* =========================================================
   🔐 LOGIN
========================================================= */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Correo y contraseña son obligatorios" });
      return;
    }

    const user = (await User.findOne({ email }).populate("planRef")) as unknown as IUserDoc | null;

    if (!user) {
      res.status(401).json({ message: "Correo o contraseña incorrectos" });
      return;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Correo o contraseña incorrectos" });
      return;
    }

    // ── Bloquear login si no ha verificado el correo ──────
    if (!user.isEmailVerified) {
      res.status(403).json({
        message: "Debes verificar tu correo antes de iniciar sesión.",
        emailNotVerified: true,
        email: user.email,
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      _id: user._id,
      empresa: user.empresa,
      email: user.email,
      plan: user.plan,
      planRef: user.planRef,
      status: user.status,
      trialDays: user.trialDays,
      registeredAt: user.registeredAt,
      planExpiresAt: user.planExpiresAt,
      token,
    });

  } catch (error) {
    console.error("Error en login:", error);
    const err = error as Error;
    res.status(500).json({ message: "Error al iniciar sesión", error: err.message });
  }
};

/* =========================================================
   ✅ VERIFICAR CONTRASEÑA DEL USUARIO
========================================================= */
export const verifyPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as Secret;
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    const { password } = req.body;
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Contraseña incorrecta" });
      return;
    }

    res.status(200).json({ success: true, message: "Contraseña verificada correctamente" });
  } catch (error) {
    console.error("Error en verifyPassword:", error);
    res.status(500).json({ message: "Error al verificar contraseña" });
  }
};

/* =========================================================
   ✏️  ACTUALIZAR DATOS DEL USUARIO (solo empresa)
   — El email ya NO se puede editar desde Mi Cuenta —
========================================================= */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as Secret;
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    const { empresa } = req.body;

    if (empresa && empresa.trim()) {
      user.empresa = empresa.trim();
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      empresa: user.empresa,
      email: user.email,
      plan: user.plan,
      status: user.status,
      trialDays: user.trialDays,
      registeredAt: user.registeredAt,
      planExpiresAt: user.planExpiresAt,
      message: "Datos actualizados correctamente",
    });
  } catch (error) {
    console.error("Error en updateUser:", error);
    const err = error as Error;
    res.status(500).json({ message: "Error al actualizar datos", error: err.message });
  }
};

/* =========================================================
   👤 GET ME — Devuelve el status actual del usuario
========================================================= */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token  = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as Secret;
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id).select("status planExpiresAt plan trialDays customPrice customDiscount customPriceNote");
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({
      status:          (user as any).status,
      plan:            (user as any).plan,
      trialDays:       (user as any).trialDays,
      planExpiresAt:   (user as any).planExpiresAt,
      customPrice:     (user as any).customPrice     ?? null,
      customDiscount:  (user as any).customDiscount  ?? null,
      customPriceNote: (user as any).customPriceNote ?? null,
    });
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
};

/* =========================================================
   🔒 CAMBIAR CONTRASEÑA
========================================================= */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as Secret;
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Ambas contraseñas son obligatorias" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ message: "La contraseña actual es incorrecta" });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({ message: "Error al cambiar la contraseña" });
  }
};