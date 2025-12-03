import mongoose, { Schema, Document } from "mongoose";

export interface IDeletedCheque extends Document {
  numero: string;
  banco: string;
  beneficiario: string;
  monto: number;
  estado: "pendiente" | "cobrado" | "anulado" | "devuelto";
  corbata?: number;
  firmadoPor?: string;
  notas?: string;
  fechaCheque?: Date;
  fechaDeposito?: Date;
  imagen?: string;       // Imagen subida a Cloudinary (opcional)
  eliminadoEn?: Date;    // Fecha de eliminación
  usuario: mongoose.Types.ObjectId; // 👈 Asociado al usuario autenticado
}

const DeletedChequeSchema = new Schema<IDeletedCheque>(
  {
    numero: { type: String, required: true },
    banco: { type: String, required: true },
    beneficiario: { type: String, required: true },
    monto: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "cobrado", "anulado", "devuelto"],
      default: "pendiente",
    },
    corbata: { type: Number, default: 0 },
    firmadoPor: { type: String },
    notas: { type: String },
    fechaCheque: { type: Date },
    fechaDeposito: { type: Date },
    imagen: { type: String },
    eliminadoEn: { type: Date, default: Date.now },

    // 👇 Campo clave para filtrar por usuario autenticado
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    collection: "deletedcheques", // 👈 asegura nombre consistente
  }
);

export default mongoose.model<IDeletedCheque>(
  "DeletedCheque",
  DeletedChequeSchema
);
