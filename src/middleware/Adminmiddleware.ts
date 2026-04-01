// src/middleware/adminMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { User } from "../models/User";

/**
 * requireAdmin
 * ─────────────
 * 1. Verifica que el request tenga un Bearer token válido.
 * 2. Carga el usuario de la BD y comprueba que role === "admin".
 * 3. Si todo OK, adjunta req.adminUser y llama next().
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const token  = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as Secret;
    const decoded = jwt.verify(token, secret) as { id: string };

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401).json({ message: "Usuario no encontrado" });
      return;
    }

    if (user.role !== "admin") {
      res.status(403).json({ message: "Acceso denegado: se requiere rol de administrador" });
      return;
    }

    (req as any).adminUser = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
};