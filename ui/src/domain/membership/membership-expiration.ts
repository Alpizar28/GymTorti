// FILE: src/domain/membership/membership-expiration.ts
import { PlanDefinition, ProductRules } from "../../config/product.types";

export type MembershipStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "NO_EXPIRATION";

type YMD = { y: number; m: number; d: number }; // m: 1-12

function getYMDInTimeZone(date: Date, timezone: string): YMD {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const parts = fmt.formatToParts(date);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? "00";
    return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")) };
}

function daysInMonth(y: number, m1to12: number): number {
    // UTC: día 0 del mes siguiente = último día del mes actual
    return new Date(Date.UTC(y, m1to12, 0)).getUTCDate();
}

function addDaysYMD(ymd: YMD, days: number): YMD {
    const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function addMonthsYMD(ymd: YMD, months: number): YMD {
    const total = (ymd.y * 12 + (ymd.m - 1)) + months;
    const ny = Math.floor(total / 12);
    const nm0 = total % 12; // 0-11
    const nm = nm0 + 1;     // 1-12
    const maxDay = daysInMonth(ny, nm);
    return { y: ny, m: nm, d: Math.min(ymd.d, maxDay) };
}

/**
 * Convierte un "YYYY-MM-DD HH:mm:ss" interpretado en `timezone` a Date (UTC real).
 * Sin librerías: se usa una aproximación UTC y se corrige iterativamente comparando en timezone.
 */
function zonedDateTimeToUtc(
    y: number,
    m1to12: number,
    d: number,
    hh: number,
    mm: number,
    ss: number,
    timezone: string
): Date {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    // arranque: asumir que esa hora es UTC (aprox)
    let guess = new Date(Date.UTC(y, m1to12 - 1, d, hh, mm, ss));

    const read = (dt: Date) => {
        const parts = fmt.formatToParts(dt);
        const get = (t: string) => parts.find(p => p.type === t)?.value ?? "00";
        return {
            y: Number(get("year")),
            m: Number(get("month")),
            d: Number(get("day")),
            hh: Number(get("hour")),
            mm: Number(get("minute")),
            ss: Number(get("second")),
        };
    };

    for (let i = 0; i < 6; i++) {
        const p = read(guess);

        const desired = Date.UTC(y, m1to12 - 1, d, hh, mm, ss);
        const current = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);

        const diffMs = desired - current;
        if (diffMs === 0) break;

        guess = new Date(guess.getTime() + diffMs);
    }

    return guess;
}

export function normalizeToEndOfDay(date: Date, timezone: string): Date {
    const { y, m, d } = getYMDInTimeZone(date, timezone);
    return zonedDateTimeToUtc(y, m, d, 23, 59, 59, timezone);
}

export function diffInDays(dateA: Date, dateB: Date, timezone: string): number {
    const a = getYMDInTimeZone(dateA, timezone);
    const b = getYMDInTimeZone(dateB, timezone);
    const utcA = Date.UTC(a.y, a.m - 1, a.d);
    const utcB = Date.UTC(b.y, b.m - 1, b.d);
    const msPerDay = 86400000;
    return Math.floor((utcB - utcA) / msPerDay);
}

export function calculateEndDate(startDate: Date, plan: PlanDefinition, timezone: string): Date | null {
    if (plan.billingPeriod === "VISIT_PACK" || plan.billingPeriod === "SESSION_PACK") return null;

    const { days, months } = plan.duration;

    // trabajamos en calendario del timezone del tenant
    const startYMD = getYMDInTimeZone(startDate, timezone);

    let endYMD: YMD;
    if (days !== undefined && days > 0) {
        endYMD = addDaysYMD(startYMD, days);
    } else if (months !== undefined && months > 0) {
        endYMD = addMonthsYMD(startYMD, months);
    } else {
        return null;
    }

    // Normalizamos a fin de día en el timezone del tenant
    return zonedDateTimeToUtc(endYMD.y, endYMD.m, endYMD.d, 23, 59, 59, timezone);
}

export function getMembershipStatus(
    now: Date,
    endDate: Date | null,
    rules: ProductRules,
    timezone: string
): MembershipStatus {
    if (!endDate) return "NO_EXPIRATION";

    if (now.getTime() > endDate.getTime()) return "EXPIRED";

    const daysRemaining = diffInDays(now, endDate, timezone);
    if (daysRemaining <= rules.warningThresholdDays) return "EXPIRING";

    return "ACTIVE";
}
