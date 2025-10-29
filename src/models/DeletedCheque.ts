import mongoose, { Schema, Document } from "mongoose";

export interface IDeletedCheque extends Document {
  numero: string;
  banco: string;
  beneficiario: string;
  monto: number;
  estado: "pendiente" | "cobrado" | "anulado";
  corbata?: number;
  firmadoPor?: string;
  notas?: string;
  fechaCheque?: Date;
  fechaDeposito?: Date;
  imagen?: string;       // ✅ Imagen subida a Cloudinary (opcional)
  eliminadoEn?: Date;    // ✅ Fecha de eliminación
}

const DeletedChequeSchema = new Schema<IDeletedCheque>(
  {
    numero: { type: String, required: true },
    banco: { type: String, required: true },
    beneficiario: { type: String, required: true },
    monto: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "cobrado", "anulado"],
      default: "pendiente",
    },
    corbata: { type: Number, default: 0 },
    firmadoPor: { type: String },
    notas: { type: String },
    fechaCheque: { type: Date },
    fechaDeposito: { type: Date },
    imagen: { type: String }, // ✅ URL de la imagen en Cloudinary
    eliminadoEn: { type: Date, default: Date.now },
  },
  { timestamps: true } // ✅ Añade createdAt / updatedAt por consistencia
);

export default mongoose.model<IDeletedCheque>("DeletedCheque", DeletedChequeSchema);
