import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  email: string;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true }, // correo de notificación
  },
  { timestamps: true }
);

export default mongoose.model<ICompany>("Company", companySchema);
