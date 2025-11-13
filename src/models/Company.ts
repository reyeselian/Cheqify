import { Schema, model } from "mongoose";

export interface ICompany {
  name: string;
  notifyEmail: string; // correo donde se enviará el aviso
}

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  notifyEmail: { type: String, required: true },
});

export const Company = model<ICompany>("Company", CompanySchema);
