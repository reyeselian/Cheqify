import mongoose, { Schema, Document } from "mongoose";

export interface ICheque extends Document {
  numero: string;
  banco: string;
  beneficiario: string;
  monto: number;
  estado: "pendiente" | "cobrado" | "devuelto";
  corbata: number;
  firmadoPor?: string;
  notas?: string;
  fechaCheque?: Date;
  fechaDeposito?: Date;
  imagen?: string; // 📸 URL de Cloudinary
  createdAt?: Date;
  updatedAt?: Date;
}

const chequeSchema: Schema = new Schema(
  {
    numero: { type: String, required: true },
    banco: { type: String, required: true },
    beneficiario: { type: String, required: true },
    monto: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "cobrado", "devuelto"],
      default: "pendiente",
    },
    corbata: { type: Number, default: 0 },
    firmadoPor: { type: String },
    notas: { type: String },
    fechaCheque: { type: Date, default: Date.now },
    fechaDeposito: { type: Date },
    imagen: { type: String }, // 📸 URL de la imagen en Cloudinary
  },
  { timestamps: true }
);

export default mongoose.model<ICheque>("Cheque", chequeSchema);
