// src/models/Configuracion.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IConfiguracion extends Document {
  user: mongoose.Types.ObjectId;
  tema: string;
  colorPrincipal: string;
  moneda: string;
  fechaFormato: string;
  columnas: Record<string, boolean>;
  filasPorPagina: number;
  dobleConfirmacion: boolean;
  alertasActivas: boolean;
  diasAviso: number;
  mostrarLogo: boolean;
  incluirFirmas: boolean;
  idioma: string;
  notificaciones: boolean;
  animaciones: boolean;
  atajos: boolean;
}

const configuracionSchema = new Schema<IConfiguracion>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    tema: { type: String, default: "oscuro" },
    colorPrincipal: { type: String, default: "#2b2b2b" },
    moneda: { type: String, default: "DOP" },
    fechaFormato: { type: String, default: "DD/MM/YYYY" },
    columnas: {
      type: Object,
      default: {
        firmadoPor: true,
        notas: true,
        fechaCheque: true,
        fechaDeposito: true,
      },
    },
    filasPorPagina: { type: Number, default: 10 },
    dobleConfirmacion: { type: Boolean, default: false },
    alertasActivas: { type: Boolean, default: true },
    diasAviso: { type: Number, default: 3 },
    mostrarLogo: { type: Boolean, default: true },
    incluirFirmas: { type: Boolean, default: false },
    idioma: { type: String, default: "es" },
    notificaciones: { type: Boolean, default: true },
    animaciones: { type: Boolean, default: true },
    atajos: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Configuracion = mongoose.model<IConfiguracion>(
  "Configuracion",
  configuracionSchema
);
