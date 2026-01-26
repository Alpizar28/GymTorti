// FILE: scripts/generate-seed-sql.ts
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'tenant.setup.json');

if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ CONFIG NOT FOUND: ${CONFIG_PATH}`);
    process.exit(1);
}

const setup = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const tenantId = setup.tenant.id || 'default';
const OUTPUT_PATH = path.join(process.cwd(), `supabase/seed/seed.${tenantId}.sql`);

// Helper to escape SQL strings
const esc = (str: string | undefined) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';

// 1. Generate Settings Insert
const settingsSql = `
-- IDEMPOTENT SEED FOR TENANT: ${setup.tenant.displayName}
-- Generated at ${new Date().toISOString()}

INSERT INTO public.tenant_settings (
    id, timezone, locale,
    currency_code, currency_symbol, currency_decimals,
    unit_weight, unit_length,
    rule_warning_days, rule_grace_days
) VALUES (
    'default',
    ${esc(setup.tenant.timezone)},
    ${esc(setup.tenant.locale)},
    ${esc(setup.product.currency.code)},
    ${esc(setup.product.currency.symbol)},
    ${setup.product.currency.decimals},
    ${esc(setup.product.units.weight)},
    ${esc(setup.product.units.length)},
    ${setup.product.rules.warningThresholdDays},
    ${setup.product.rules.graceDays || 0}
)
ON CONFLICT (id) DO UPDATE SET
    timezone = EXCLUDED.timezone,
    locale = EXCLUDED.locale,
    currency_code = EXCLUDED.currency_code,
    currency_symbol = EXCLUDED.currency_symbol,
    currency_decimals = EXCLUDED.currency_decimals,
    unit_weight = EXCLUDED.unit_weight,
    unit_length = EXCLUDED.unit_length,
    rule_warning_days = EXCLUDED.rule_warning_days,
    rule_grace_days = EXCLUDED.rule_grace_days,
    updated_at = NOW();
`;

// 2. Generate Plans Insert
// We first delete existing plans overrides that are NOT in the new list to keep it clean?
// Or just upsert known ones. A full sync is safer: truncate or delete not in list.
// For safety, let's just UPSERT the defined ones. Unmentioned plans remain as they were or need manual cleanup if strict sync desired.
// For this MVP, we upsert defined keys.

const plans = setup.product.plans;
const planInserts = Object.keys(plans).map(planId => {
    const p = plans[planId];
    // visible defaults to enabled if undefined
    const visible = p.visible !== undefined ? p.visible : p.enabled;
    const price = p.price !== undefined && p.price !== null ? p.price : 'NULL';

    return `
    ('${planId}', ${p.enabled}, ${visible}, ${price}, ${esc(p.currencyCode)}, ${esc(p.notes)})`;
}).join(',\n');

const plansSql = plansInsertsString(planInserts);

function plansInsertsString(values: string) {
    if (!values) return '-- No plans configured.';

    return `
INSERT INTO public.tenant_plan_overrides (
    plan_id, enabled, visible, price, currency_override, notes
) VALUES ${values}
ON CONFLICT (plan_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    visible = EXCLUDED.visible,
    price = EXCLUDED.price,
    currency_override = EXCLUDED.currency_override,
    notes = EXCLUDED.notes,
    updated_at = NOW();
`;
}

// Write file
const finalSql = settingsSql + '\n' + plansSql;
// Ensure directory exists
const dir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(OUTPUT_PATH, finalSql);
console.log(`✅ Seed SQL generated at: ${OUTPUT_PATH}`);
