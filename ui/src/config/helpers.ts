// FILE: src/config/helpers.ts
import { ProductConfig, PlanDefinition, TenantPlanSettings, CurrencyCode } from "./product.types";

export type FullPlan = PlanDefinition & TenantPlanSettings;

/**
 * Retorna un plan combinando su definición base y la configuración del tenant.
 * - Si no existe en membershipPlans, retorna undefined.
 * - Si no tiene configuración en enabledPlans, usa defaults (enabled: false, visible: false).
 * - Si visible es undefined en tenant settings, asume el valor de enabled.
 */
export function getPlan(
    config: ProductConfig,
    planId: string
): FullPlan | undefined {
    const basePlan = config.membershipPlans[planId];
    if (!basePlan) return undefined;

    const tenantSettings = config.enabledPlans[planId];

    // Default settings si no hay override
    if (!tenantSettings) {
        return {
            ...basePlan,
            enabled: false,
            // Por defecto no visibles si no están explícitamente configurados
            visible: false,
            price: null
        };
    }

    return {
        ...basePlan,
        ...tenantSettings,
        // Si visible no está definido, hereda de enabled
        visible: tenantSettings.visible ?? tenantSettings.enabled
    };
}

/**
 * Retorna la lista de todos los planes con enabled === true.
 * Itera sobre todo el catálogo universal para encontrar coincidencias activas.
 */
export function getEnabledPlans(config: ProductConfig): FullPlan[] {
    const planIds = Object.keys(config.membershipPlans);
    const result: FullPlan[] = [];

    for (const id of planIds) {
        const plan = getPlan(config, id);
        if (plan && plan.enabled) {
            result.push(plan);
        }
    }
    return result;
}

/**
 * Retorna la lista de todos los planes con visible === true.
 * Útil para mostrar en pantallas de venta/landing page.
 */
export function getVisiblePlans(config: ProductConfig): FullPlan[] {
    const planIds = Object.keys(config.membershipPlans);
    const result: FullPlan[] = [];

    for (const id of planIds) {
        const plan = getPlan(config, id);
        if (plan && plan.visible) {
            result.push(plan);
        }
    }
    return result;
}

/**
 * Formatea un monto numérico con Intl.NumberFormat respetando la configuración de moneda.
 */
export function formatMoney(
    config: ProductConfig,
    amount: number | null,
    overrideCurrencyCode?: CurrencyCode
): string {
    if (amount === null || amount === undefined) return "";

    const { code, decimals, format, symbol } = config.currency;
    const targetCurrency = overrideCurrencyCode || code;

    // Usamos Intl.NumberFormat para formatear el número (separadores de miles/decimales)
    // Nota: style 'currency' a veces fuerza el símbolo del locale.
    // Usaremos 'decimal' para tener control manual del símbolo y posición si se requiere estricto formato visual.
    const formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true,
    });

    const formattedValue = formatter.format(amount);

    if (format === "symbol_before") {
        // Ejemplo: $ 1,200.00
        return `${symbol}${formattedValue}`;
    } else {
        // Ejemplo: 1,200.00 ₡
        return `${formattedValue} ${symbol}`;
    }
}
