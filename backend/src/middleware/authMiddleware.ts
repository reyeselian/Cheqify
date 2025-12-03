import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // ✅ Verificamos que venga el header Authorization con Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extraer el token
      token = req.headers.authorization.split(" ")[1];

      // Verificar y decodificar el token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as { id: string };

      // Buscar el usuario en la base de datos (sin password)
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        res.status(401).json({ message: "Usuario no encontrado" });
        return;
      }

      // ⬇️ Lo que estará disponible en (req as any).user
      (req as any).user = {
        id: user._id,
        email: user.email,
        empresa: user.empresa,
        company: user.company,
      };

      next();
    } catch (error) {
      console.error("Error en protect:", error);
      res.status(401).json({ message: "Token inválido" });
    }
  } else {
    res.status(401).json({ message: "Token faltante" });
  }
};
