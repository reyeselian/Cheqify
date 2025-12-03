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
  usuario: mongoose.Schema.Types.ObjectId; // referencia al usuario que registró el cheque
  company: string;                         // ✅ ahora guarda el nombre de la empresa
  reminderSent?: boolean;                  // si ya se envió el recordatorio
  reminderSentAt?: Date;                   // fecha en que se envió el recordatorio
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

    // 🔹 Nombre de la empresa propietaria del cheque
    company: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔹 Campos de control del recordatorio por correo
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
);

const Cheque = mongoose.model<ICheque>("Cheque", chequeSchema);
export default Cheque;
