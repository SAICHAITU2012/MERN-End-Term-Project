import bcrypt from "bcrypt";
import crypto from "crypto";
import Family from "../models/family.model.js";
import User from "../models/user.model.js";
import Member from "../models/member.model.js";
import Medication from "../models/medication.model.js";
import DoseEvent from "../models/doseEvent.model.js";
import Notification from "../models/notification.model.js";
import { isValidTimezone } from "../utils/timezone.js";

const fail = (res, status, message) => res.status(status).json({ message });

const notifyFamily = (familyId, type, title, body, meta = {}) =>
    Notification.create({ family: familyId, audience: "caregivers", type, title, body, meta });

// GET /api/family
export const getMyFamily = async (req, res, next) => {
    try {
        const family = await Family.findById(req.user.family).lean();
        if (!family) return fail(res, 404, "Family not found");

        const members = await Member.find({ family: family._id, active: true })
            .sort({ createdAt: 1 })
            .lean();
        const caregivers = await User.find({ family: family._id, role: "caregiver" })
            .select("name email avatar createdAt")
            .lean();
        const memberLogins = await User.find({ family: family._id, role: "member" })
            .select("name email linkedMember")
            .lean();

        res.status(200).json({ family, members, caregivers, memberLogins });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/family  (caregiver)  { name?, timezone?, escalationAfterMin? }
export const updateFamily = async (req, res, next) => {
    try {
        const family = await Family.findById(req.user.family);
        if (!family) return fail(res, 404, "Family not found");

        const { name, timezone, escalationAfterMin } = req.body;
        if (name !== undefined) {
            if (!name.trim()) return fail(res, 422, "Family name cannot be empty");
            family.name = name.trim();
        }
        if (timezone !== undefined) {
            if (!isValidTimezone(timezone)) return fail(res, 422, "Unknown timezone");
            family.timezone = timezone;
        }
        if (escalationAfterMin !== undefined) {
            const mins = Number(escalationAfterMin);
            if (!Number.isInteger(mins) || mins < 5 || mins > 720) {
                return fail(res, 422, "Escalation window must be between 5 and 720 minutes");
            }
            family.escalationAfterMin = mins;
        }
        await family.save();
        res.status(200).json({ family });
    } catch (error) {
        next(error);
    }
};

// POST /api/family/invite/rotate  (caregiver) — regenerate invite code
export const rotateInvite = async (req, res, next) => {
    try {
        const family = await Family.findById(req.user.family);
        if (!family) return fail(res, 404, "Family not found");
        family.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
        await family.save();
        res.status(200).json({ inviteCode: family.inviteCode });
    } catch (error) {
        next(error);
    }
};

// POST /api/family/members  (caregiver)
// Body: { name, age?, gender?, conditions?, doctor?, notes?,
//         accountEmail?, accountPassword? } — account fields create a
//   login (role=member) so the person can confirm their own doses.
export const createMember = async (req, res, next) => {
    try {
        const { name, age, gender, conditions, doctor, notes, accountEmail, accountPassword } =
            req.body;

        if (!name || !name.trim()) return fail(res, 422, "Member name is required");
        if (age !== undefined && age !== null && age !== "" &&
            (!Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 130)) {
            return fail(res, 422, "Age must be a whole number between 0 and 130");
        }

        const member = await Member.create({
            family: req.user.family,
            name: name.trim(),
            age: age === "" || age === undefined || age === null ? undefined : Number(age),
            gender: gender || "",
            conditions,
            doctor,
            notes,
        });

        let login = null;
        if (accountEmail) {
            login = await createMemberLoginInternal(req, member, accountEmail, accountPassword);
        }

        await notifyFamily(
            req.user.family,
            "member_added",
            `${member.name} joined your care circle`,
            "Their medication schedule can now be set up.",
            { member: member._id }
        );

        res.status(201).json({ member, login });
    } catch (error) {
        next(error);
    }
};

// POST /api/family/members/:id/login  (caregiver) — create a login for an
// existing member. Body: { email, password }
export const createMemberLogin = async (req, res, next) => {
    try {
        const member = await Member.findOne({
            _id: req.params.id,
            family: req.user.family,
            active: true,
        });
        if (!member) return fail(res, 404, "Member not found");

        const login = await createMemberLoginInternal(req, member, req.body.email, req.body.password);
        res.status(201).json({ login });
    } catch (error) {
        next(error);
    }
};

async function createMemberLoginInternal(req, member, email, password) {
    if (!email || !password) {
        const err = new Error("Account email and password are required");
        err.statusCode = 422;
        throw err;
    }
    if (String(password).length < 8) {
        const err = new Error("Password must be at least 8 characters");
        err.statusCode = 422;
        throw err;
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
        const err = new Error("An account with this email already exists");
        err.statusCode = 409;
        throw err;
    }
    const hashed = await bcrypt.hash(password, 10);
    return User.create({
        name: member.name,
        email: email.toLowerCase().trim(),
        password: hashed,
        role: "member",
        family: req.user.family,
        linkedMember: member._id,
    });
}

// PATCH /api/family/members/:id  (caregiver)
export const updateMember = async (req, res, next) => {
    try {
        const member = await Member.findOne({ _id: req.params.id, family: req.user.family });
        if (!member) return fail(res, 404, "Member not found");

        const allowed = ["name", "age", "gender", "conditions", "doctor", "notes", "avatar"];
        for (const field of allowed) {
            if (req.body[field] !== undefined) member[field] = req.body[field];
        }
        if (member.age !== undefined && member.age !== null &&
            (member.age < 0 || member.age > 130)) {
            return fail(res, 422, "Age must be between 0 and 130");
        }
        await member.save();
        res.status(200).json({ member });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/family/members/:id  (caregiver) — soft delete + stop their schedule
export const deactivateMember = async (req, res, next) => {
    try {
        const member = await Member.findOne({ _id: req.params.id, family: req.user.family });
        if (!member) return fail(res, 404, "Member not found");

        member.active = false;
        await member.save();

        await Medication.updateMany({ member: member._id, active: true }, { active: false });
        await DoseEvent.updateMany(
            { member: member._id, status: "pending", scheduledFor: { $gte: new Date() } },
            { status: "cancelled" }
        );

        res.status(200).json({ message: `${member.name} was removed from the care circle` });
    } catch (error) {
        next(error);
    }
};
