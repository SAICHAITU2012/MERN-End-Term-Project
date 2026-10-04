import { TIME_RE } from "../models/medication.model.js";

// Everything dose-related is expressed in the FAMILY's wall-clock time
// (IANA timezone, e.g. "Asia/Kolkata") and converted to absolute UTC
// instants only where the scheduler needs them. These helpers are pure
// Intl-based so they handle half-hour offsets and DST correctly.

const pad2 = (n) => String(n).padStart(2, "0");

// Intl parts of a UTC instant as seen in the given timezone
const partsInTz = (date, tz) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
    });
    const raw = {};
    for (const p of dtf.formatToParts(date)) raw[p.type] = p.value;
    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
        year: Number(raw.year),
        month: Number(raw.month),
        day: Number(raw.day),
        hour: Number(raw.hour) % 24,
        minute: Number(raw.minute),
        second: Number(raw.second),
        dayOfWeek: weekdays[raw.weekday] ?? 0,
    };
};

const offsetMs = (date, tz) => {
    const p = partsInTz(date, tz);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asUTC - date.getTime();
};

/**
 * Current wall-clock information in a timezone, right now.
 * @returns {{dateLabel:string, timeLabel:string, dayOfWeek:number, minutesOfDay:number}}
 */
export const nowInTz = (tz) => {
    const p = partsInTz(new Date(), tz);
    return {
        dateLabel: `${p.year}-${pad2(p.month)}-${pad2(p.day)}`,
        timeLabel: `${pad2(p.hour)}:${pad2(p.minute)}`,
        dayOfWeek: p.dayOfWeek,
        minutesOfDay: p.hour * 60 + p.minute,
    };
};

/**
 * Convert a family-local wall clock ("2026-10-05", "09:00") in `tz`
 * to the absolute UTC Date it corresponds to.
 */
export const zonedToUtc = (dateLabel, timeLabel, tz) => {
    if (!TIME_RE.test(timeLabel)) throw new Error(`Invalid time label: ${timeLabel}`);
    const naive = Date.parse(`${dateLabel}T${timeLabel}:00Z`);
    if (Number.isNaN(naive)) throw new Error(`Invalid date label: ${dateLabel}`);
    // two-pass refinement handles DST boundaries
    let ts = naive - offsetMs(new Date(naive), tz);
    ts = naive - offsetMs(new Date(ts), tz);
    return new Date(ts);
};

/**
 * Add minutes to a "HH:mm" label, wrapping around midnight.
 */
export const addMinutesToLabel = (timeLabel, minutes) => {
    const [h, m] = timeLabel.split(":").map(Number);
    const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
    return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};

/**
 * UTC instant N minutes after an absolute instant (kept for clarity in jobs).
 */
export const minutesLater = (date, minutes) => new Date(date.getTime() + minutes * 60000);

export const isValidTimezone = (tz) => {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    } catch {
        return false;
    }
};

// ISO week key like "2026-W41" — used to dedupe weekly digests
export const weekKeyFor = (dateLabel) => {
    const d = new Date(`${dateLabel}T12:00:00Z`);
    const target = new Date(d);
    const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    target.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    const week = 1 + Math.round((target - firstThursday) / (7 * 86400000));
    return `${target.getUTCFullYear()}-W${pad2(week)}`;
};
