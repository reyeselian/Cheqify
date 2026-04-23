// src/models/PlanRequest.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPlanRequest extends Document {
  userId: mongoose.Types.ObjectId;
  empresa: string;
  email: string;
  planActual: string;
  planSolicitado: string;
  status: "pendiente" | "contactado" | "completado" | "rechazado";
  notas: string;
  createdAt: Date;
}

const PlanRequestSchema = new Schema<IPlanRequest>({
  userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
  empresa:        { type: String, required: true },
  email:          { type: String, required: true },
  planActual:     { type: String, required: true },
  planSolicitado: { type: String, required: true },
  status:         { type: String, enum: ["pendiente", "contactado", "completado", "rechazado"], default: "pendiente" },
  notas:          { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model<IPlanRequest>("PlanRequest", PlanRequestSchema);