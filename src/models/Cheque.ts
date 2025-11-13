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
  usuario: mongoose.Schema.Types.ObjectId;  // referencia al usuario que registró el cheque
  company: mongoose.Schema.Types.ObjectId;   // referencia a la empresa
  reminderSent?: boolean;                    // si ya se envió el recordatorio
  reminderSentAt?: Date;                     // fecha en que se envió el recordatorio
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

    // 🔹 Referencia al usuario que registró el cheque
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Nueva referencia a la empresa propietaria del cheque
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // 🔹 Campos de control del recordatorio por correo
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
);

const Cheque = mongoose.model<ICheque>("Cheque", chequeSchema);
export default Cheque;
