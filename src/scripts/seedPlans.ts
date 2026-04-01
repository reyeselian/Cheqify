// src/scripts/seedPlans.ts

import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "../models/Plan";

dotenv.config();

const plans = [
  {
    name: "Prueba",
    type: "trial",
    price: 0,
    durationDays: 0,
    trialDays: 14,
    description: "Explora Cheqify sin compromiso",
    features: [
      "14 días gratis",
      "Acceso completo al sistema",
      "Gestión de cheques",
      "Soporte por email",
    ],
    isActive: true,
  },
  {
    name: "Mensual",
    type: "monthly",
    price: 29,
    durationDays: 30,
    trialDays: 0,
    description: "Ideal para empresas en crecimiento",
    features: [
      "Renovación cada 30 días",
      "Acceso completo al sistema",
      "Gestión ilimitada de cheques",
      "Reportes y estadísticas",
      "Soporte prioritario",
    ],
    isActive: true,
  },
  {
    name: "Anual",
    type: "annual",
    price: 290,
    durationDays: 365,
    trialDays: 0,
    description: "El mejor valor para tu empresa",
    features: [
      "2 meses gratis incluidos",
      "Acceso completo al sistema",
      "Gestión ilimitada de cheques",
      "Reportes avanzados",
      "Soporte 24/7 prioritario",
      "Historial completo",
    ],
    isActive: true,
  },
];

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI no definido en el .env");

    await mongoose.connect(mongoUri);
    console.log("✅ Conectado a MongoDB");

    let creados = 0;
    let omitidos = 0;

    for (const plan of plans) {
      const existe = await Plan.findOne({ type: plan.type });
      if (existe) {
        console.log(`⚠️  Plan '${plan.name}' ya existe — omitido`);
        omitidos++;
      } else {
        await Plan.create(plan);
        console.log(`✅ Plan '${plan.name}' creado`);
        creados++;
      }
    }

    console.log(`\n🎉 Seed finalizado: ${creados} creado(s), ${omitidos} omitido(s)`);
  } catch (error) {
    console.error("❌ Error en seed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
    process.exit(0);
  }
};

seed();