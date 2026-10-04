import cron from "node-cron";
import Family from "../models/family.model.js";
import Member from "../models/member.model.js";
import Medication from "../models/medication.model.js";
import DoseEvent from "../models/doseEvent.model.js";
import Notification from "../models/notification.model.js";
import { isDbConnected } from "../config/db.js";
import { nowInTz, zonedToUtc, weekKeyFor } from "../utils/timezone.js";
import { dateLabelRange } from "../controllers/report.controller.js";
import { sendMail } from "../utils/mailer.js";

// ── The scheduler is the product's engine. ────────────────────────────────
// One tick runs every minute and, for every family, in THAT family's
// timezone:
//   1. materialises DoseEvents whose scheduled wall-clock time just arrived
//   2. escalates pending doses past the family's grace window → "missed"
//      + caregiver notifications (+ optional email)
//   3. raises low-stock alerts
//   4. posts the Sunday-evening weekly adherence digest

const notifyCaregivers = (familyId, type, title, body, meta = {}) =>
    Notification.create({ family: familyId, audience: "caregivers", type, title, body, meta });

const emailCaregivers = async (familyId, subject, text) => {
    const users = await import("../models/user.model.js").then((m) =>
        m.default.find({ family: familyId, role: "caregiver" }).select("email").lean()
    );
    await Promise.all(users.map((u) => sendMail({ to: u.email, subject, text })));
};

export const tick = async () => {
    if (!isDbConnected()) return { skipped: "db-not-ready" };

    const families = await Family.find().lean();
    const result = { families: families.length, dosesCreated: 0, escalated: 0, digests: 0 };

    for (const family of families) {
        try {
            const { dateLabel, timeLabel, dayOfWeek } = nowInTz(family.timezone);

            // 1 ── materialise due doses ────────────────────────────────
            const meds = await Medication.find({
                family: family._id,
                active: true,
                doseTimes: timeLabel,
            }).lean();

            const memberIds = new Set(
                (await Member.find({ family: family._id, active: true }).select("_id").lean())
                    .map((m) => String(m._id))
            );

            for (const med of meds) {
                if (!memberIds.has(String(med.member))) continue;
                if (!med.daysOfWeek.includes(dayOfWeek)) continue;

                const startDate = med.startDate ? new Date(med.startDate) : null;
                if (startDate && zonedToUtc(dateLabel, timeLabel, family.timezone) < startDate) continue;
                if (med.endDate && new Date(med.endDate) < zonedToUtc(dateLabel, timeLabel, family.timezone)) continue;

                const created = await DoseEvent.create({
                    family: family._id,
                    member: med.member,
                    medication: med._id,
                    dateLabel,
                    timeLabel,
                    scheduledFor: zonedToUtc(dateLabel, timeLabel, family.timezone),
                }).catch((err) => {
                    if (err.code === 11000) return null; // already exists — idempotent
                    throw err;
                });
                if (created) result.dosesCreated += 1;
            }

            // 2 ── escalate overdue pending doses ───────────────────────
            const graceMs = (family.escalationAfterMin || 60) * 60000;
            const overdue = await DoseEvent.find({
                family: family._id,
                status: "pending",
                escalatedAt: null,
                scheduledFor: { $lt: new Date(Date.now() - graceMs) },
            })
                .populate("medication", "name")
                .populate("member", "name");

            for (const dose of overdue) {
                dose.status = "missed";
                dose.escalatedAt = new Date();
                await dose.save();

                const title = `${dose.member?.name || "Member"} missed ${dose.medication?.name || "a dose"}`;
                const body = `The ${dose.timeLabel} dose was not confirmed within ${family.escalationAfterMin} minutes. Please check in with them.`;
                await notifyCaregivers(family._id, "dose_missed", title, body, {
                    doseEvent: dose._id,
                    medication: dose.medication?._id,
                    member: dose.member?._id,
                });
                await emailCaregivers(family._id, `MedMate: ${title}`, `${title}\n\n${body}`);
                result.escalated += 1;
            }

            // 3 ── low-stock alerts ─────────────────────────────────────
            const lowStockMeds = await Medication.find({
                family: family._id,
                active: true,
                refillNotifiedAt: null,
                $expr: { $lte: ["$stockCount", "$stockThreshold"] },
            }).populate("member", "name");

            for (const med of lowStockMeds) {
                med.refillNotifiedAt = new Date();
                await med.save();
                await notifyCaregivers(
                    family._id,
                    "refill_low",
                    `Refill needed: ${med.name}`,
                    `Only ${med.stockCount} doses left for ${med.member?.name || "a member"}.`,
                    { medication: med._id, member: med.member?._id }
                );
            }

            // 4 ── weekly digest, Sundays 18:00 family-local ────────────
            if (dayOfWeek === 0 && timeLabel === "18:00") {
                const weekKey = weekKeyFor(dateLabel);
                if (family.lastDigestKey !== weekKey) {
                    await postWeeklyDigest(family, weekKey);
                    result.digests += 1;
                }
            }
        } catch (error) {
            console.error(`[scheduler] family ${family._id} tick failed:`, error.message);
        }
    }

    return result;
};

const postWeeklyDigest = async (family, weekKey) => {
    const labels = dateLabelRange(
        nowInTz(family.timezone).dateLabel,
        7
    );
    const members = await Member.find({ family: family._id, active: true })
        .select("name")
        .lean();

    const doses = await DoseEvent.find({
        family: family._id,
        member: { $in: members.map((m) => m._id) },
        dateLabel: { $gte: labels[0], $lte: labels[labels.length - 1] },
        status: { $in: ["taken", "missed", "skipped"] },
    }).lean();

    const lines = [];
    for (const member of members) {
        const mine = doses.filter((d) => String(d.member) === String(member._id));
        if (!mine.length) continue;
        const taken = mine.filter((d) => d.status === "taken").length;
        const missed = mine.filter((d) => d.status === "missed").length;
        const skipped = mine.filter((d) => d.status === "skipped").length;
        const pctv = Math.round((taken / mine.length) * 100);
        lines.push(`${member.name}: ${pctv}% (${taken} taken, ${missed} missed, ${skipped} skipped)`);
    }

    await Family.findByIdAndUpdate(family._id, { lastDigestKey: weekKey });
    if (lines.length) {
        await notifyCaregivers(
            family._id,
            "weekly_digest",
            "Weekly adherence digest",
            `Last 7 days:\n${lines.join("\n")}\n\nHandy to carry along to the next doctor visit.`
        );
    }
};

let task = null;

export const startScheduler = () => {
    if (task) return task;
    // every minute
    task = cron.schedule("* * * * *", async () => {
        try {
            const r = await tick();
            if (r.dosesCreated || r.escalated || r.digests) {
                console.log("[scheduler]", JSON.stringify(r));
            }
        } catch (error) {
            console.error("[scheduler] tick crashed:", error);
        }
    });
    console.log("[scheduler] started — ticking every minute");
    return task;
};

export default startScheduler;
