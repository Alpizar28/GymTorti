// FILE: src/config/product.types.ts

export type BillingPeriod =
    | "DAY"
    | "WEEK"
    | "BIWEEKLY"
    | "MONTH"
    | "QUARTER"
    | "HALF_YEAR"
    | "YEAR"
    | "VISIT_PACK"
    | "SESSION_PACK"
    | "CUSTOM";

export interface PlanDuration {
    days?: number;
    months?: number;
    visits?: number;
    sessions?: number;
}

export interface PlanFlags {
    isFamily?: boolean;
    isYouth?: boolean;
    isSenior?: boolean;
    isStudent?: boolean;
    isCorporate?: boolean;
    isCouple?: boolean;
    isDuo?: boolean;
    isTrial?: boolean;
    isOffPeak?: boolean;
    [key: string]: boolean | undefined;
}

export interface PlanDefinition {
    id: string;
    label: string;
    billingPeriod: BillingPeriod;
    duration: PlanDuration;
    flags?: PlanFlags;
    description?: string;
}

export interface TenantPlanSettings {
    enabled: boolean;
    /**
     * Controla si se muestra en UI. 
     * Si es undefined, asume el valor de `enabled`.
     */
    visible?: boolean;
    price: number | null;
    currencyCode?: string;
    notes?: string;
}

export type CurrencyCode = "USD" | "CRC" | "EUR" | "MXN" | "COP" | string;

export interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    decimals: 0 | 2;
    format: "symbol_before" | "symbol_after";
}

export interface ProductRules {
    warningThresholdDays: number;
    graceDays?: number;
    allowBackdatedPayments?: boolean;
    allowFutureStartDate?: boolean;
}

export interface ProductConfig {
    timezone: string; // IANA string (e.g., "America/Panama")
    currency: CurrencyConfig;
    units: {
        weight: "kg" | "lb";
        length: "cm" | "in";
    };
    /**
     * Catálogo universal de planes definidos en el sistema.
     */
    membershipPlans: Record<string, PlanDefinition>;

    /**
     * Configuración específica por tenant (gym).
     * Determina qué planes están activos/visibles y su precio.
     */
    enabledPlans: Record<string, TenantPlanSettings>;

    rules: ProductRules;
}
