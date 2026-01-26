// FILE: src/config/app.config.ts

import { UNIVERSAL_PLANS, PLAN_IDS } from "./plans.catalog";
import { ProductConfig } from "./product.types";

// PLACEHOLDER CONFIG (Until 'npm run tenant:build' is run)
// This file allows the repo to compile/run in dev mode immediately after clone.
// Real values are injected by scripts/generate-app-config.ts based on tenant.setup.json.

const uiConfig = {
    gymName: "Template Gym",
    gymTagline: "Your Slogan Here",
    logo: "/images/placeholder-logo.png", // Ensure this exists or use a generic one
    theme: {
        primary: {
            from: "#3b82f6", // blue-500
            to: "#1d4ed8",   // blue-700
            solid: "#3b82f6",
            hover: "#2563eb",
            active: "#1d4ed8",
            focus: "#3b82f6",
        },
        secondary: {
            from: "#ffffff",
            to: "#f0f0f0",
        },
    },
    uiMode: "dark" as "light" | "dark",
    surfaces: {
        light: {
            background: "#ffffff",
            surface: "#f9fafb",
            surfaceHover: "#f3f4f6",
            border: "#e5e7eb",
            text: "#111827",
            textMuted: "#6b7280",
        },
        dark: {
            background: "#0B0B0D",
            surface: "#111113",
            surfaceHover: "#17171A",
            border: "#26262A",
            text: "#F5F5F6",
            textMuted: "#A1A1AA",
        },
    },
    poweredByJokem: {
        enabled: true,
        text: "Powered by Jokem",
        url: "https://jokem.tech",
    },
};

const productConfig: ProductConfig = {
    timezone: "UTC",
    currency: {
        code: "USD",
        symbol: "$",
        decimals: 2,
        format: "symbol_before"
    },
    units: {
        weight: "kg",
        length: "cm"
    },
    membershipPlans: UNIVERSAL_PLANS,
    enabledPlans: {
        // No plans enabled by default in template mode
        [PLAN_IDS.DAILY]: { enabled: false, price: 0 }
    },
    rules: {
        warningThresholdDays: 5,
        graceDays: 0,
        allowBackdatedPayments: false,
        allowFutureStartDate: false
    }
};

export const appConfig = {
    ...uiConfig,
    ui: uiConfig,
    product: productConfig,
    // GUARDRAIL: This flag indicates the app is in template mode and not configured.
    __TEMPLATE_NOT_CONFIGURED__: true
} as const;

export type AppConfig = typeof appConfig;

export function getPrimaryGradient() {
    return `linear-gradient(to right, ${appConfig.theme.primary.from}, ${appConfig.theme.primary.to})`;
}

export const themeColors = {
    primary: {
        solid: () => appConfig.theme.primary.solid,
        hover: () => appConfig.theme.primary.hover,
        active: () => appConfig.theme.primary.active,
        focus: () => appConfig.theme.primary.focus,
    },
};
