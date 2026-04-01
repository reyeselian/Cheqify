// src/models/Plan.ts

import mongoose, { Document, Schema } from "mongoose";

export type PlanType = "trial" | "monthly" | "annual";

export interface IPlan extends Document {
  name: string;
  type: PlanType;
  price: number;
  durationDays: number;      // 0 = indefinido (anual usa 365)
  trialDays: number;         // solo aplica si type === "trial"
  description: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["trial", "monthly", "annual"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      // trial → 0 (usa trialDays), monthly → 30, annual → 365
    },
    trialDays: {
      type: Number,
      default: 0,
      // solo relevante cuando type === "trial"
    },
    description: {
      type: String,
      default: "",
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPlan>("Plan", PlanSchema);