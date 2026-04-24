// src/controllers/Admincontroller.ts
import { Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { User } from "../models/User";
import Plan from "../models/Plan";
import Cheque from "../models/Cheque";

const generateToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as Secret, { expiresIn: "8h" });

/* =========================================================
   🔐 ADMIN LOGIN
========================================================= */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ message: "Correo y contraseña son obligatorios" }); return; }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.role !== "admin") { res.status(401).json({ message: "Credenciales incorrectas o sin permisos de administrador" }); return; }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) { res.status(401).json({ message: "Credenciales incorrectas o sin permisos de administrador" }); return; }

    const token = generateToken((user._id as any).toString());
    res.status(200).json({ _id: user._id, email: user.email, empresa: user.empresa, role: user.role, token });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

/* =========================================================
   📊 DASHBOARD STATS
========================================================= */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, activeUsers, trialUsers, expiredUsers, totalPlans, totalCheques, recentUsers] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", status: "active" }),
      User.countDocuments({ role: "user", status: "trial" }),
      User.countDocuments({ role: "user", status: { $in: ["trial_expired", "payment_required", "blocked"] } }),
      Plan.countDocuments({ isActive: true }),
      Cheque.countDocuments(),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5).select("empresa email plan status registeredAt"),
    ]);

    const [monthlyCount, annualCount] = await Promise.all([
      User.countDocuments({ role: "user", plan: "monthly", status: "active" }),
      User.countDocuments({ role: "user", plan: "annual",  status: "active" }),
    ]);

    const [monthlyPlan, annualPlan] = await Promise.all([
      Plan.findOne({ type: "monthly" }),
      Plan.findOne({ type: "annual"  }),
    ]);

    const estimatedRevenue =
      (monthlyCount * (monthlyPlan?.price ?? 0)) +
      (annualCount  * (annualPlan?.price  ?? 0));

    res.json({
      users:   { total: totalUsers, active: activeUsers, trial: trialUsers, expired: expiredUsers },
      plans:   { total: totalPlans },
      cheques: { total: totalCheques },
      revenue: { estimated: estimatedRevenue, monthly: monthlyCount, annual: annualCount },
      recentUsers,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

/* =========================================================
   💰 INGRESOS — resumen por usuario
========================================================= */
export const getIngresos = async (req: Request, res: Response): Promise<void> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string)?.trim() || "";

    const filter: any = { role: "user", status: "active" };
    if (search) filter.$or = [
      { email:   { $regex: search, $options: "i" } },
      { empresa: { $regex: search, $options: "i" } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("empresa email plan planRef status planExpiresAt registeredAt customPrice customDiscount customPriceNote")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("planRef", "name price type"),
      User.countDocuments(filter),
    ]);

    const [monthlyPlan, annualPlan] = await Promise.all([
      Plan.findOne({ type: "monthly" }),
      Plan.findOne({ type: "annual"  }),
    ]);

    const planPrices: Record<string, number> = {
      monthly: monthlyPlan?.price ?? 0,
      annual:  annualPlan?.price  ?? 0,
      trial:   0,
    };

    const ingresos = users.map((u: any) => {
      const precioBase = planPrices[u.plan] ?? 0;
      let precioFinal  = precioBase;

      if (u.customPrice !== null && u.customPrice !== undefined) {
        precioFinal = u.customPrice;
      } else if (u.customDiscount !== null && u.customDiscount !== undefined) {
        precioFinal = precioBase * (1 - u.customDiscount / 100);
      }

      return {
        _id: u._id, empresa: u.empresa, email: u.email,
        plan: u.plan, status: u.status,
        planExpiresAt: u.planExpiresAt, registeredAt: u.registeredAt,
        precioBase, customPrice: u.customPrice, customDiscount: u.customDiscount,
        customPriceNote: u.customPriceNote, precioFinal,
        tieneDescuento: u.customPrice !== null || u.customDiscount !== null,
      };
    });

    const now       = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const usuariosActivosMes = await User.countDocuments({
      role: "user", status: "active",
      $or: [{ registeredAt: { $gte: inicioMes } }, { planExpiresAt: { $gte: inicioMes } }],
    });

    const totalMensual = ingresos.reduce((sum, u) => sum + (u.plan === "monthly" ? u.precioFinal : 0), 0);
    const totalAnual   = ingresos.reduce((sum, u) => sum + (u.plan === "annual"  ? u.precioFinal : 0), 0);
    const totalGeneral = totalMensual + totalAnual;

    res.json({
      ingresos, total, page, pages: Math.ceil(total / limit),
      resumen: { totalMensual, totalAnual, totalGeneral, usuariosActivos: total, usuariosActivosMes },
    });
  } catch (err) {
    console.error("Ingresos error:", err);
    res.status(500).json({ message: "Error al obtener ingresos" });
  }
};

/* =========================================================
   💲 ASIGNAR PRECIO PERSONALIZADO
========================================================= */
export const setPrecioPersonalizado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customPrice, customDiscount, customPriceNote } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }

    if (customPrice !== undefined && customPrice !== null) {
      if (typeof customPrice !== "number" || customPrice < 0) {
        res.status(400).json({ message: "El precio personalizado debe ser un número positivo" }); return;
      }
      user.customPrice    = customPrice;
      user.customDiscount = null;
    } else if (customDiscount !== undefined && customDiscount !== null) {
      if (typeof customDiscount !== "number" || customDiscount < 0 || customDiscount > 100) {
        res.status(400).json({ message: "El descuento debe ser entre 0 y 100" }); return;
      }
      user.customDiscount = customDiscount;
      user.customPrice    = null;
    } else {
      user.customPrice    = null;
      user.customDiscount = null;
    }

    user.customPriceNote = customPriceNote?.trim() || null;
    await user.save();

    res.json({ message: "Precio personalizado actualizado", user: {
      _id: user._id, customPrice: user.customPrice,
      customDiscount: user.customDiscount, customPriceNote: user.customPriceNote,
    }});
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar precio", error: err.message });
  }
};

/* =========================================================
   👥 LIST USERS
========================================================= */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
    const search = (req.query.search as string)?.trim() || "";
    const status = req.query.status as string;
    const plan   = req.query.plan   as string;

    const filter: any = { role: "user" };
    if (search) filter.$or = [
      { email:   { $regex: search, $options: "i" } },
      { empresa: { $regex: search, $options: "i" } },
    ];
    if (status) filter.status = status;
    if (plan)   filter.plan   = plan;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("planRef", "name price"),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

/* =========================================================
   👤 GET USER BY ID
========================================================= */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("planRef", "name price type");
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuario" });
  }
};

/* =========================================================
   ✏️ UPDATE USER
========================================================= */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const allowed = ["empresa", "email", "plan", "planRef", "status", "planExpiresAt", "trialDays"];
    const updates: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // ✅ Si el admin cambia el plan a monthly/annual y no especificó status,
    // forzar status = "active" para evitar que quede bloqueado por la lógica de trial
    if (
      updates.plan &&
      ["monthly", "annual"].includes(updates.plan) &&
      !updates.status
    ) {
      updates.status = "active";
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }
    res.json({ message: "Usuario actualizado", user });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
  }
};

/* =========================================================
   🚫 BLOCK / UNBLOCK USER
========================================================= */
export const toggleBlockUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }
    if (user.role === "admin") { res.status(400).json({ message: "No puedes bloquear a otro admin" }); return; }
    user.status = user.status === "blocked" ? "active" : "blocked";
    await user.save();
    res.json({ message: `Usuario ${user.status === "blocked" ? "bloqueado" : "desbloqueado"}`, status: user.status });
  } catch (err) {
    res.status(500).json({ message: "Error al cambiar estado del usuario" });
  }
};

/* =========================================================
   🗑️ DELETE USER
========================================================= */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ message: "Usuario no encontrado" }); return; }
    if (user.role === "admin") { res.status(400).json({ message: "No puedes eliminar un administrador" }); return; }
    await user.deleteOne();
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

/* =========================================================
   📋 PLAN CRUD
========================================================= */
export const adminGetPlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch { res.status(500).json({ message: "Error al obtener planes" }); }
};

export const adminCreatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, price, durationDays, trialDays, description, features } = req.body;
    const exists = await Plan.findOne({ type });
    if (exists) { res.status(400).json({ message: `Ya existe un plan de tipo '${type}'` }); return; }
    const plan = await Plan.create({ name, type, price: price ?? 0, durationDays: durationDays ?? 0, trialDays: trialDays ?? 0, description: description ?? "", features: features ?? [] });
    res.status(201).json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ message: "Error al crear plan", error: err.message });
  }
};

export const adminUpdatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const allowed = ["name", "price", "durationDays", "trialDays", "description", "features", "isActive"];
    const updates: any = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const plan = await Plan.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ message: "Error al actualizar plan", error: err.message });
  }
};

export const adminTogglePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) { res.status(404).json({ message: "Plan no encontrado" }); return; }
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json({ success: true, data: plan });
  } catch { res.status(500).json({ message: "Error al cambiar estado del plan" }); }
};