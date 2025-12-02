import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { User } from "../models/User";
import { Document } from "mongoose";

/* =========================================================
   🧩 INTERFAZ
========================================================= */
interface IUserDoc extends Document {
  _id: string;
  empresa: string;
  email: string;
  password: string;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

/* =========================================================
   🔑 GENERAR TOKEN
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
    const { empresa, email, password } = req.body;

    if (!empresa || !email || !password) {
      res.status(400).json({ message: "Todos los campos son obligatorios" });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "El correo ya está registrado" });
      return;
    }

    const user = (await User.create({ empresa, email, password })) as IUserDoc;
    const token = generateToken(user._id.toString());

    res.status(201).json({
      _id: user._id,
      empresa: user.empresa,
      email: user.email,
      token,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    const err = error as Error;
    res.status(500).json({ message: "Error en el registro", error: err.message });
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

    const user = (await User.findOne({ email })) as IUserDoc | null;

    if (!user) {
      res.status(401).json({ message: "Correo o contraseña incorrectos" });
      return;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Correo o contraseña incorrectos" });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      _id: user._id,
      empresa: user.empresa,
      email: user.email,
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
