import mongoose, { Schema, Document } from "mongoose";

export interface ICheque extends Document {
  numero: string;
  banco: string;
  beneficiario: string;
  monto: number;
  estado: string;
  firmadoPor?: string;
  fechaCheque?: Date;
  fechaDeposito?: Date;
  notas?: string;
  imagen?: string;
  usuario: mongoose.Schema.Types.ObjectId; // referencia al usuario
}

const chequeSchema = new Schema<ICheque>(
  {
    numero: { type: String, required: true },
    banco: { type: String, required: true },
    beneficiario: { type: String, required: true },
    monto: { type: Number, required: true },
    estado: { type: String, default: "pendiente" },
    firmadoPor: { type: String },
    fechaCheque: { type: Date },
    fechaDeposito: { type: Date },
    notas: { type: String },
    imagen: { type: String },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // 🔹 causa del error, ahora lo llenaremos correctamente
    },
  },
  { timestamps: true }
);

const Cheque = mongoose.model<ICheque>("Cheque", chequeSchema);
export default Cheque;
