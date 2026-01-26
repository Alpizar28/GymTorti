// FILE: src/config/plans.catalog.ts
import { PlanDefinition } from "./product.types";

export const PLAN_IDS = {
    DAILY: "DAILY",
    WEEKLY: "WEEKLY",
    BIWEEKLY: "BIWEEKLY",
    MONTHLY: "MONTHLY",
    QUARTERLY: "QUARTERLY",
    SEMIANNUAL: "SEMIANNUAL",
    ANNUAL: "ANNUAL",
    DUO: "DUO",
    COUPLE: "COUPLE",
    YOUTH: "YOUTH",
    SENIOR: "SENIOR",
    STUDENT: "STUDENT",
    CORPORATE: "CORPORATE",
    FAMILY: "FAMILY",
    DAY_PASS_10: "DAY_PASS_10",
    DAY_PASS_20: "DAY_PASS_20",
    SESSION_8: "SESSION_8",
    SESSION_12: "SESSION_12",
    FREE_TRIAL: "FREE_TRIAL",
    OFF_PEAK: "OFF_PEAK",
} as const;

export const UNIVERSAL_PLANS: Record<string, PlanDefinition> = {
    // --- Planes básicos por tiempo ---
    [PLAN_IDS.DAILY]: {
        id: PLAN_IDS.DAILY,
        label: "Diaria",
        billingPeriod: "DAY",
        duration: { days: 1 },
        description: "Acceso por un día completo"
    },
    [PLAN_IDS.WEEKLY]: {
        id: PLAN_IDS.WEEKLY,
        label: "Semanal",
        billingPeriod: "WEEK",
        duration: { days: 7 },
        description: "Acceso por 7 días"
    },
    [PLAN_IDS.BIWEEKLY]: {
        id: PLAN_IDS.BIWEEKLY,
        label: "Quincenal",
        billingPeriod: "BIWEEKLY",
        duration: { days: 15 }, // Asumiendo quincena natural o 14 días según regla de negocio (aquí 15 estándar)
        description: "Acceso por 15 días"
    },
    [PLAN_IDS.MONTHLY]: {
        id: PLAN_IDS.MONTHLY,
        label: "Mensual",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        description: "Membresía estándar mes a mes"
    },
    [PLAN_IDS.QUARTERLY]: {
        id: PLAN_IDS.QUARTERLY,
        label: "Trimestral",
        billingPeriod: "QUARTER",
        duration: { months: 3 },
        description: "Pago cada 3 meses"
    },
    [PLAN_IDS.SEMIANNUAL]: {
        id: PLAN_IDS.SEMIANNUAL,
        label: "Semestral",
        billingPeriod: "HALF_YEAR",
        duration: { months: 6 },
        description: "Pago cada 6 meses"
    },
    [PLAN_IDS.ANNUAL]: {
        id: PLAN_IDS.ANNUAL,
        label: "Anual",
        billingPeriod: "YEAR",
        duration: { months: 12 },
        description: "Pago anual con mejor precio"
    },

    // --- Planes Especiales / Demográficos ---
    [PLAN_IDS.DUO]: {
        id: PLAN_IDS.DUO,
        label: "Plan Dúo",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isDuo: true },
        description: "Para dos personas entrenando juntas"
    },
    [PLAN_IDS.COUPLE]: {
        id: PLAN_IDS.COUPLE,
        label: "Pareja",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isCouple: true },
        description: "Plan mensual para parejas"
    },
    [PLAN_IDS.YOUTH]: {
        id: PLAN_IDS.YOUTH,
        label: "Juvenil",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isYouth: true },
        description: "Tarifa para menores de edad"
    },
    [PLAN_IDS.SENIOR]: {
        id: PLAN_IDS.SENIOR,
        label: "Adulto Mayor",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isSenior: true },
        description: "Tarifa para tercera edad"
    },
    [PLAN_IDS.STUDENT]: {
        id: PLAN_IDS.STUDENT,
        label: "Estudiante",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isStudent: true },
        description: "Requiere carnet de estudiante"
    },
    [PLAN_IDS.CORPORATE]: {
        id: PLAN_IDS.CORPORATE,
        label: "Corporativo",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isCorporate: true },
        description: "Plan empresarial"
    },
    [PLAN_IDS.FAMILY]: {
        id: PLAN_IDS.FAMILY,
        label: "Familiar",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isFamily: true },
        description: "Grupo familiar"
    },

    // --- Pases y Paquetes ---
    [PLAN_IDS.DAY_PASS_10]: {
        id: PLAN_IDS.DAY_PASS_10,
        label: "Bono 10 Visitas",
        billingPeriod: "VISIT_PACK",
        duration: { visits: 10 },
        description: "10 accesos sin caducidad inmediata"
    },
    [PLAN_IDS.DAY_PASS_20]: {
        id: PLAN_IDS.DAY_PASS_20,
        label: "Bono 20 Visitas",
        billingPeriod: "VISIT_PACK",
        duration: { visits: 20 },
        description: "20 accesos sin caducidad inmediata"
    },
    [PLAN_IDS.SESSION_8]: {
        id: PLAN_IDS.SESSION_8,
        label: "Pack 8 Sesiones",
        billingPeriod: "SESSION_PACK",
        duration: { sessions: 8 },
        description: "8 clases guiadas"
    },
    [PLAN_IDS.SESSION_12]: {
        id: PLAN_IDS.SESSION_12,
        label: "Pack 12 Sesiones",
        billingPeriod: "SESSION_PACK",
        duration: { sessions: 12 },
        description: "12 clases guiadas"
    },

    // --- Otros ---
    [PLAN_IDS.FREE_TRIAL]: {
        id: PLAN_IDS.FREE_TRIAL,
        label: "Prueba Gratuita",
        billingPeriod: "DAY",
        duration: { days: 1 },
        flags: { isTrial: true },
        description: "Acceso de prueba"
    },
    [PLAN_IDS.OFF_PEAK]: {
        id: PLAN_IDS.OFF_PEAK,
        label: "Horario Valle",
        billingPeriod: "MONTH",
        duration: { months: 1 },
        flags: { isOffPeak: true },
        description: "Acceso restringido a horas valle"
    }
};
