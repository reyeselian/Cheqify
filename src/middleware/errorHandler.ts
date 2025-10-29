import { Request, Response, NextFunction } from "express";

export default function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("⚠️ Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Error interno" });
}
