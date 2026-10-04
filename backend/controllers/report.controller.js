import DoseEvent from "../models/doseEvent.model.js";
import Member from "../models/member.model.js";
import { nowInTz } from "../utils/timezone.js";
import Family from "../models/family.model.js";

const fail = (res, status, message) => res.status(status).json({ message });

// "YYYY-MM-DD" labels for the last `days` days, oldest first (family tz)
export const dateLabelRange = (todayLabel, days) => {
    const labels = [];
    const anchor = new Date(`${todayLabel}T12:00:00Z`); // noon-UTC avoids tz boundary flips
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(anchor.getTime() - i * 86400000);
        labels.push(d.toISOString().slice(0, 10));
    }
    return labels;
};

const pct = (taken, total) => (total === 0 ? null : Math.round((taken / total) * 100));

// GET /api/reports/member/:memberId?days=7|30|90
export const getMemberReport = async (req, res, next) => {
    try {
        const { memberId } = req.params;
        // members may only read their own report
        if (req.user.role === "member" && String(req.user.linkedMember) !== memberId) {
            return fail(res, 403, "You can only view your own report");
        }
        const member = await Member.findOne({
            _id: memberId,
            family: req.user.family,
        }).lean();
        if (!member) return fail(res, 404, "Member not found");

        const family = await Family.findById(req.user.family).lean();
        const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;

        const { dateLabel: todayLabel } = nowInTz(family.timezone);
        const labels = dateLabelRange(todayLabel, days);
        const from = labels[0];

        const doses = await DoseEvent.find({
            family: req.user.family,
            member: memberId,
            dateLabel: { $gte: from, $lte: todayLabel },
            status: { $in: ["taken", "skipped", "missed"] },
        })
            .populate("medication", "name dosage form")
            .lean();

        const totals = { taken: 0, missed: 0, skipped: 0 };
        const perDayMap = new Map();
        const perMedMap = new Map();

        for (const dose of doses) {
            totals[dose.status] += 1;

            if (!perDayMap.has(dose.dateLabel)) {
                perDayMap.set(dose.dateLabel, { taken: 0, missed: 0, skipped: 0, total: 0 });
            }
            const day = perDayMap.get(dose.dateLabel);
            day[dose.status] += 1;
            day.total += 1;

            const medId = String(dose.medication?._id || "unknown");
            if (!perMedMap.has(medId)) {
                perMedMap.set(medId, {
                    medication: dose.medication,
                    taken: 0,
                    missed: 0,
                    skipped: 0,
                });
            }
            perMedMap.get(medId)[dose.status] += 1;
        }

        const scheduledTotal = totals.taken + totals.missed + totals.skipped;

        const perDay = labels.map((label) => {
            const day = perDayMap.get(label) || { taken: 0, missed: 0, skipped: 0, total: 0 };
            return {
                dateLabel: label,
                ...day,
                pct: day.total ? pct(day.taken, day.total) : null,
            };
        });

        const perMedication = [...perMedMap.values()]
            .map((m) => ({
                ...m,
                total: m.taken + m.missed + m.skipped,
                pct: pct(m.taken, m.taken + m.missed + m.skipped),
            }))
            .sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100));

        // adherence streak: consecutive days (walking back from the most
        // recent day with data) where every scheduled dose was taken
        let streak = 0;
        for (let i = perDay.length - 1; i >= 0; i--) {
            const day = perDay[i];
            if (day.total === 0) {
                if (i === perDay.length - 1) continue; // today may not have started yet
                break;
            }
            if (day.taken === day.total) streak += 1;
            else break;
        }

        const bestMed = perMedication.length ? perMedication[perMedication.length - 1] : null;
        const worstMed = perMedication.length ? perMedication[0] : null;

        res.status(200).json({
            member,
            rangeDays: days,
            from,
            to: todayLabel,
            adherencePct: pct(totals.taken, scheduledTotal),
            totals: { ...totals, scheduled: scheduledTotal },
            streakDays: streak,
            perDay,
            perMedication,
            bestMedication: bestMed && bestMed.total ? bestMed : null,
            worstMedication: worstMed && worstMed.total ? worstMed : null,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/reports/family?days=7 — per-member snapshot for the dashboard
export const getFamilyReport = async (req, res, next) => {
    try {
        const family = await Family.findById(req.user.family).lean();
        const days = [7, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 7;

        const { dateLabel: todayLabel } = nowInTz(family.timezone);
        const labels = dateLabelRange(todayLabel, days);
        const from = labels[0];

        const members = await Member.find({ family: req.user.family, active: true })
            .select("name avatar age")
            .lean();

        const doses = await DoseEvent.aggregate([
            {
                $match: {
                    family: family._id,
                    dateLabel: { $gte: from, $lte: todayLabel },
                    status: { $in: ["taken", "missed", "skipped"] },
                },
            },
            {
                $group: {
                    _id: { member: "$member", status: "$status" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const byMember = new Map(
            members.map((m) => [String(m._id), { ...m, taken: 0, missed: 0, skipped: 0 }])
        );
        for (const row of doses) {
            const entry = byMember.get(String(row._id.member));
            if (entry) entry[row._id.status] = row.count;
        }

        const summaries = [...byMember.values()].map((m) => {
            const total = m.taken + m.missed + m.skipped;
            return { ...m, total, adherencePct: pct(m.taken, total) };
        });

        res.status(200).json({ summaries, rangeDays: days });
    } catch (error) {
        next(error);
    }
};
