import DoseEvent from "../models/doseEvent.model.js";
import Medication from "../models/medication.model.js";
import Notification from "../models/notification.model.js";
import Family from "../models/family.model.js";
import { nowInTz, zonedToUtc, addMinutesToLabel } from "../utils/timezone.js";

const fail = (res, status, message) => res.status(status).json({ message });

const MAX_SNOOZES = 3;
const SNOOZE_MINUTES = 15;

// can this user act on a dose belonging to the given member id?
const canActOn = (user, dose) => {
    if (user.role === "caregiver") return true;
    return user.linkedMember && String(user.linkedMember) === String(dose.member);
};

const populateDose = (query) =>
    query
        .populate("medication", "name dosage form instructions stockCount stockThreshold")
        .populate("member", "name avatar age");

// GET /api/doses/today?memberId=&date=YYYY-MM-DD
// Returns the family's dose card view for one day (defaults to today in
// the family's timezone), plus that day's label so the client stays in sync.
export const getDosesForDay = async (req, res, next) => {
    try {
        const family = await Family.findById(req.user.family).lean();
        if (!family) return fail(res, 404, "Family not found");

        const { dateLabel: todayLabel } = nowInTz(family.timezone);
        const dateLabel = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "")
            ? req.query.date
            : todayLabel;

        const query = { family: req.user.family, dateLabel };
        // member accounts are scoped to their own doses; caregivers see everyone
        if (req.user.role === "member" && req.user.linkedMember) {
            query.member = req.user.linkedMember;
        } else if (req.query.memberId) {
            query.member = req.query.memberId;
        }

        const doses = await populateDose(
            DoseEvent.find(query).sort({ timeLabel: 1 })
        ).lean();

        res.status(200).json({ dateLabel, todayLabel, doses });
    } catch (error) {
        next(error);
    }
};

// GET /api/doses/history?memberId=&from=&to=&page=&limit=
export const getDoseHistory = async (req, res, next) => {
    try {
        const { memberId, from, to } = req.query;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 30);

        const query = { family: req.user.family };
        if (req.user.role === "member" && req.user.linkedMember) {
            query.member = req.user.linkedMember;
        } else if (memberId) {
            query.member = memberId;
        }
        if (from || to) {
            query.dateLabel = {};
            if (from) query.dateLabel.$gte = from;
            if (to) query.dateLabel.$lte = to;
        }

        const total = await DoseEvent.countDocuments(query);
        const doses = await populateDose(
            DoseEvent.find(query)
                .sort({ dateLabel: -1, timeLabel: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        ).lean();

        res.status(200).json({ doses, total, page, pages: Math.ceil(total / limit) || 1 });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/doses/:id/taken  { note? }
export const confirmTaken = async (req, res, next) => {
    try {
        const dose = await DoseEvent.findOne({
            _id: req.params.id,
            family: req.user.family,
        });
        if (!dose) return fail(res, 404, "Dose not found");
        if (!canActOn(req.user, dose)) {
            return fail(res, 403, "You can only manage your own doses");
        }
        if (dose.status === "taken") {
            return fail(res, 409, "This dose was already confirmed");
        }
        if (dose.status === "cancelled") {
            return fail(res, 409, "This dose was cancelled — the medication was stopped");
        }
        if (dose.status === "skipped") {
            return fail(res, 409, "This dose was skipped and can no longer be confirmed");
        }

        const wasMissed = dose.status === "missed";
        dose.status = "taken";
        dose.actedBy = req.user._id;
        dose.actedAt = new Date();
        if (req.body.note) dose.note = req.body.note.slice(0, 300);
        await dose.save();

        // consuming a dose decrements stock and may trigger a refill alert
        const medication = await Medication.findById(dose.medication);
        let refillAlert = false;
        if (medication && medication.active) {
            medication.stockCount = Math.max(0, medication.stockCount - 1);
            if (
                medication.stockCount <= medication.stockThreshold &&
                !medication.refillNotifiedAt
            ) {
                medication.refillNotifiedAt = new Date();
                refillAlert = true;
                const member = await (await import("../models/member.model.js")).default
                    .findById(dose.member)
                    .lean();
                await Notification.create({
                    family: req.user.family,
                    audience: "caregivers",
                    type: "refill_low",
                    title: `Refill needed: ${medication.name}`,
                    body: `Only ${medication.stockCount} doses of ${medication.name} left${
                        member ? ` for ${member.name}` : ""
                    }. Time to get a new strip/bottle.`,
                    meta: { medication: medication._id, member: dose.member },
                });
            }
            await medication.save();
        }

        const populated = await populateDose(DoseEvent.findById(dose._id)).lean();
        res.status(200).json({ dose: populated, wasMissed, refillAlert });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/doses/:id/skipped  { reason? } — caregivers are notified
export const confirmSkipped = async (req, res, next) => {
    try {
        const dose = await DoseEvent.findOne({ _id: req.params.id, family: req.user.family });
        if (!dose) return fail(res, 404, "Dose not found");
        if (!canActOn(req.user, dose)) {
            return fail(res, 403, "You can only manage your own doses");
        }
        if (dose.status !== "pending" && dose.status !== "missed") {
            return fail(res, 409, `This dose is already marked "${dose.status}"`);
        }

        dose.status = "skipped";
        dose.actedBy = req.user._id;
        dose.actedAt = new Date();
        if (req.body.reason) dose.note = req.body.reason.slice(0, 300);
        await dose.save();

        const [medication, member] = await Promise.all([
            Medication.findById(dose.medication).lean(),
            (await import("../models/member.model.js")).default.findById(dose.member).lean(),
        ]);
        const actorIsMember = req.user.role === "member";
        await Notification.create({
            family: req.user.family,
            audience: "caregivers",
            type: "system",
            title: `${member?.name || "A member"} skipped ${medication?.name || "a dose"}`,
            body: `${dose.timeLabel} dose skipped${
                req.body.reason ? ` — "${req.body.reason}"` : ""
            }.${actorIsMember ? " Confirmed by the member themselves." : ""}`,
            meta: { doseEvent: dose._id, medication: dose.medication, member: dose.member },
        });

        const populated = await populateDose(DoseEvent.findById(dose._id)).lean();
        res.status(200).json({ dose: populated });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/doses/:id/snooze — pushes the reminder 15 minutes later (max 3)
export const snoozeDose = async (req, res, next) => {
    try {
        const dose = await DoseEvent.findOne({ _id: req.params.id, family: req.user.family });
        if (!dose) return fail(res, 404, "Dose not found");
        if (!canActOn(req.user, dose)) {
            return fail(res, 403, "You can only manage your own doses");
        }
        if (dose.status !== "pending") {
            return fail(res, 409, `Only pending doses can be snoozed (this one is ${dose.status})`);
        }
        if (dose.snoozeCount >= MAX_SNOOZES) {
            return fail(res, 410, `Snoozed ${MAX_SNOOZES} times already — a decision is needed`);
        }

        const family = await Family.findById(req.user.family).lean();
        if (!family) return fail(res, 404, "Family not found");

        dose.snoozeCount += 1;
        const nextLabel = addMinutesToLabel(dose.timeLabel, SNOOZE_MINUTES);
        // snoozing past midnight rolls the dose into the next calendar day
        let nextDate = dose.dateLabel;
        let nextScheduled = zonedToUtc(nextDate, nextLabel, family.timezone);
        if (nextScheduled.getTime() <= dose.scheduledFor.getTime()) {
            nextDate = new Date(Date.parse(`${nextDate}T12:00:00Z`) + 86400000)
                .toISOString()
                .slice(0, 10);
            nextScheduled = zonedToUtc(nextDate, nextLabel, family.timezone);
        }
        dose.timeLabel = nextLabel;
        dose.dateLabel = nextDate;
        dose.scheduledFor = nextScheduled;
        try {
            await dose.save();
        } catch (err) {
            // another dose of the same medication already owns that slot —
            // keep the original label and only push the reminder time
            if (err.code !== 11000) throw err;
            const prev = await DoseEvent.findById(dose._id);
            dose.timeLabel = prev.timeLabel;
            dose.dateLabel = prev.dateLabel;
            dose.scheduledFor = nextScheduled;
            await dose.save();
        }

        const populated = await populateDose(DoseEvent.findById(dose._id)).lean();
        res.status(200).json({ dose: populated });
    } catch (error) {
        next(error);
    }
};
