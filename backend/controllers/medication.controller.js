import Medication from "../models/medication.model.js";
import Member from "../models/member.model.js";
import DoseEvent from "../models/doseEvent.model.js";
import Notification from "../models/notification.model.js";
import { nowInTz } from "../utils/timezone.js";
import Family from "../models/family.model.js";

const fail = (res, status, message) => res.status(status).json({ message });

const notifyFamily = (familyId, type, title, body, meta = {}) =>
    Notification.create({ family: familyId, audience: "caregivers", type, title, body, meta });

const findFamilyMedication = async (req) =>
    Medication.findOne({ _id: req.params.id, family: req.user.family });

// GET /api/medications?memberId=&active=
export const getMedications = async (req, res, next) => {
    try {
        const query = { family: req.user.family };
        if (req.query.memberId) query.member = req.query.memberId;
        if (req.query.active === "true") query.active = true;
        if (req.query.active === "false") query.active = false;

        const medications = await Medication.find(query)
            .populate("member", "name avatar age")
            .sort({ createdAt: 1 })
            .lean();
        res.status(200).json({ medications });
    } catch (error) {
        next(error);
    }
};

// POST /api/medications  (caregiver)
export const createMedication = async (req, res, next) => {
    try {
        const {
            memberId, name, dosage, form, instructions,
            doseTimes, daysOfWeek, stockCount, stockThreshold, endDate,
        } = req.body;

        if (!memberId || !name || !name.trim()) {
            return fail(res, 422, "Member and medication name are required");
        }
        const member = await Member.findOne({
            _id: memberId,
            family: req.user.family,
            active: true,
        });
        if (!member) return fail(res, 404, "Member not found in your family");

        const stock = Number(stockCount ?? 0);
        const threshold = Number(stockThreshold ?? 5);
        if (!Number.isInteger(stock) || stock < 0) {
            return fail(res, 422, "Stock must be a whole number of 0 or more");
        }
        if (!Number.isInteger(threshold) || threshold < 0) {
            return fail(res, 422, "Stock threshold must be a whole number of 0 or more");
        }

        const medication = await Medication.create({
            family: req.user.family,
            member: member._id,
            name: name.trim(),
            dosage,
            form,
            instructions,
            doseTimes,
            daysOfWeek: Array.isArray(daysOfWeek) && daysOfWeek.length ? daysOfWeek : undefined,
            stockCount: stock,
            stockThreshold: threshold,
            endDate: endDate || undefined,
            createdBy: req.user._id,
        });

        await notifyFamily(
            req.user.family,
            "med_added",
            `${medication.name} added for ${member.name}`,
            `Doses at ${medication.doseTimes.join(", ")}. Stock: ${medication.stockCount}.`,
            { medication: medication._id, member: member._id }
        );

        res.status(201).json({ medication });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/medications/:id  (caregiver)
export const updateMedication = async (req, res, next) => {
    try {
        const medication = await findFamilyMedication(req);
        if (!medication) return fail(res, 404, "Medication not found");

        const editable = [
            "name", "dosage", "form", "instructions",
            "doseTimes", "daysOfWeek", "stockThreshold", "endDate",
        ];
        for (const field of editable) {
            if (req.body[field] !== undefined) medication[field] = req.body[field];
        }
        // an empty daysOfWeek would make the schedule never fire — treat as daily
        if (Array.isArray(medication.daysOfWeek) && medication.daysOfWeek.length === 0) {
            medication.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
        }

        // refilling stock clears the low-stock alert flag
        if (req.body.stockCount !== undefined) {
            const stock = Number(req.body.stockCount);
            if (!Number.isInteger(stock) || stock < 0) {
                return fail(res, 422, "Stock must be a whole number of 0 or more");
            }
            if (stock > medication.stockCount) medication.refillNotifiedAt = null;
            medication.stockCount = stock;
        }

        // deactivating cancels all still-pending future doses
        if (req.body.active === false && medication.active) {
            const family = await Family.findById(req.user.family).lean();
            const { dateLabel } = nowInTz(family.timezone);
            medication.active = false;
            await DoseEvent.updateMany(
                {
                    medication: medication._id,
                    status: "pending",
                    $or: [
                        { dateLabel: { $gt: dateLabel } },
                        { dateLabel, scheduledFor: { $gte: new Date() } },
                    ],
                },
                { status: "cancelled" }
            );
        }
        if (req.body.active === true) medication.active = true;

        await medication.save();
        res.status(200).json({ medication });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/medications/:id  (caregiver) — soft delete
export const deactivateMedication = async (req, res, next) => {
    try {
        const medication = await findFamilyMedication(req);
        if (!medication) return fail(res, 404, "Medication not found");
        medication.active = false;
        await medication.save();
        await DoseEvent.updateMany(
            { medication: medication._id, status: "pending", scheduledFor: { $gte: new Date() } },
            { status: "cancelled" }
        );
        res.status(200).json({ message: `${medication.name} was stopped` });
    } catch (error) {
        next(error);
    }
};
