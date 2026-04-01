// src/models/User.ts
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type PlanType      = "trial" | "monthly" | "annual";
export type AccountStatus = "trial" | "trial_expired" | "active" | "payment_required" | "blocked";
export type UserRole      = "user" | "admin";

export interface IUser extends Document {
  email: string;
  password: string;
  empresa: string;
  company?: mongoose.Types.ObjectId;
  role: UserRole;
  planRef: mongoose.Types.ObjectId;
  plan: PlanType;
  trialDays: number;
  registeredAt: Date;
  planExpiresAt: Date | null;
  planCycle: number;
  status: AccountStatus;

  // ── Email verification ────────────────────────────
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;

  // ── Precio personalizado ──────────────────────────
  customPrice: number | null;           // precio fijo personalizado
  customDiscount: number | null;        // descuento en % (0-100)
  customPriceNote: string | null;       // mensaje que ve el usuario

  matchPassword(entered: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    empresa:  { type: String, required: true, trim: true },
    company:  { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    planRef:       { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    plan:          { type: String, enum: ["trial","monthly","annual"], default: "trial" },
    trialDays:     { type: Number, default: 14 },
    registeredAt:  { type: Date, default: () => new Date() },
    planExpiresAt: { type: Date, default: null },
    planCycle:     { type: Number, default: 0 },
    status:        { type: String, enum: ["trial","trial_expired","active","payment_required","blocked"], default: "trial" },

    isEmailVerified:          { type: Boolean, default: false },
    emailVerificationToken:   { type: String, default: null },
    emailVerificationExpires: { type: Date,   default: null },

    // ── Precio personalizado ──────────────────────────
    customPrice:    { type: Number, default: null },
    customDiscount: { type: Number, default: null, min: 0, max: 100 },
    customPriceNote:{ type: String, default: null, trim: true },
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

userSchema.methods.matchPassword = async function (entered: string) {
  return bcrypt.compare(entered, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);