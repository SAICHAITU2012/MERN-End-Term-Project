import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Family from "../models/family.model.js";
import User from "../models/user.model.js";
import Member from "../models/member.model.js";
import Medication from "../models/medication.model.js";
import DoseEvent from "../models/doseEvent.model.js";
import Notification from "../models/notification.model.js";
import { nowInTz, zonedToUtc } from "../utils/timezone.js";
import { dateLabelRange } from "../controllers/report.controller.js";

// Seeds a realistic demo family with 14 days of dose history so the
// dashboard, heatmap and reports have real-looking data for the demo video.
//
//   npm run seed
//
// Logins created:
//   caregiver: priya@medmate.demo / demo12345
//   caregiver: arjun@medmate.demo / demo12345
//   member:    ramesh@medmate.demo / demo12345  (linked to "Ramesh")
//   member:    sunita@medmate.demo / demo12345  (linked to "Sunita")

const TZ = "Asia/Kolkata";

// deterministic pseudo-random so reruns produce the same story
let seedState = 42;
const rand = () => {
    seedState = (seedState * 1103515245 + 12345) % 2147483648;
    return seedState / 2147483648;
};

const doseHistoryFor = (med, memberName, days, missChance, skipChance) => {
    const { dateLabel: todayLabel } = nowInTz(TZ);
    const labels = dateLabelRange(todayLabel, days);
    const events = [];

    for (const label of labels) {
        const dayOfWeek = new Date(`${label}T12:00:00Z`).getUTCDay();
        if (!med.daysOfWeek.includes(dayOfWeek)) continue;

        for (const timeLabel of med.doseTimes) {
            // today: only generate doses whose time has already passed
            if (label === todayLabel) {
                const { minutesOfDay } = nowInTz(TZ);
                const [h, m] = timeLabel.split(":").map(Number);
                if (h * 60 + m >= minutesOfDay) continue;
            }

            const roll = rand();
            let status = "taken";
            if (roll < missChance) status = "missed";
            else if (roll < missChance + skipChance) status = "skipped";

            const scheduledFor = zonedToUtc(label, timeLabel, TZ);
            const actedAt =
                status === "taken"
                    ? new Date(scheduledFor.getTime() + Math.floor(rand() * 40 + 5) * 60000)
                    : scheduledFor;

            events.push({
                family: med.family,
                member: med.member,
                medication: med._id,
                dateLabel: label,
                timeLabel,
                scheduledFor,
                status,
                actedAt: status === "missed" ? undefined : actedAt,
                escalatedAt: status === "missed" ? new Date(scheduledFor.getTime() + 3600000) : undefined,
                snoozeCount: status === "taken" && rand() < 0.08 ? 1 : 0,
                note: status === "skipped" ? "Felt nauseous, skipped this one" : undefined,
            });
        }
    }
    return events;
};

const seed = async () => {
    await connectDB();
    console.log("Clearing existing data…");
    await Promise.all([
        Family.deleteMany({}),
        User.deleteMany({}),
        Member.deleteMany({}),
        Medication.deleteMany({}),
        DoseEvent.deleteMany({}),
        Notification.deleteMany({}),
    ]);

    const family = await Family.create({
        name: "Sharma Family",
        timezone: TZ,
        inviteCode: "DEMO42",
        escalationAfterMin: 60,
    });

    const password = await bcryptHash("demo12345");

    const priya = await User.create({
        name: "Priya Sharma",
        email: "priya@medmate.demo",
        password,
        role: "caregiver",
        family: family._id,
    });
    const arjun = await User.create({
        name: "Arjun Sharma",
        email: "arjun@medmate.demo",
        password,
        role: "caregiver",
        family: family._id,
    });

    const ramesh = await Member.create({
        family: family._id,
        name: "Ramesh (Dad)",
        age: 68,
        gender: "male",
        conditions: "Type 2 diabetes, hypothyroidism, mild hypertension",
        doctor: "Dr. Mehta — City Care Clinic",
        notes: "Prefers tablets with warm water after breakfast. Sometimes naps through the evening dose.",
    });
    const sunita = await Member.create({
        family: family._id,
        name: "Sunita (Mom)",
        age: 64,
        gender: "female",
        conditions: "Post-surgery recovery — knee replacement, calcium deficiency",
        doctor: "Dr. Iyer — Ortho Care Hospital",
        notes: "Physiotherapy on weekdays at 5 PM. Calcium dose should not clash with tea.",
    });

    await User.create({
        name: "Ramesh (Dad)",
        email: "ramesh@medmate.demo",
        password,
        role: "member",
        family: family._id,
        linkedMember: ramesh._id,
    });
    await User.create({
        name: "Sunita (Mom)",
        email: "sunita@medmate.demo",
        password,
        role: "member",
        family: family._id,
        linkedMember: sunita._id,
    });

    const meds = await Medication.insertMany([
        {
            family: family._id,
            member: ramesh._id,
            name: "Metformin 500mg",
            dosage: "1 tablet",
            form: "tablet",
            instructions: "After breakfast and after dinner",
            doseTimes: ["09:00", "21:00"],
            stockCount: 6,
            stockThreshold: 10,
            refillNotifiedAt: new Date(),
            createdBy: priya._id,
        },
        {
            family: family._id,
            member: ramesh._id,
            name: "Thyronorm 50mcg",
            dosage: "1 tablet",
            form: "tablet",
            instructions: "Empty stomach, 30 min before breakfast",
            doseTimes: ["07:00"],
            stockCount: 38,
            stockThreshold: 10,
            createdBy: priya._id,
        },
        {
            family: family._id,
            member: ramesh._id,
            name: "Telmisartan 40mg",
            dosage: "1 tablet",
            form: "tablet",
            instructions: "For blood pressure, after lunch",
            doseTimes: ["14:00"],
            stockCount: 21,
            stockThreshold: 8,
            createdBy: arjun._id,
        },
        {
            family: family._id,
            member: sunita._id,
            name: "Calcium + Vitamin D3",
            dosage: "1 tablet",
            form: "tablet",
            instructions: "After lunch, 2h away from tea/coffee",
            doseTimes: ["14:30"],
            stockCount: 44,
            stockThreshold: 12,
            createdBy: priya._id,
        },
        {
            family: family._id,
            member: sunita._id,
            name: "Physio day exercises",
            dosage: "15 min routine",
            form: "other",
            instructions: "Knee rehab routine from Dr. Iyer's sheet",
            doseTimes: ["17:00"],
            daysOfWeek: [1, 2, 3, 4, 5],
            stockCount: 999,
            stockThreshold: 0,
            createdBy: arjun._id,
        },
    ]);

    // 14 days of history — Ramesh ~85% adherence, Sunita ~95%
    const history = [
        ...doseHistoryFor(meds[0], "Ramesh", 14, 0.1, 0.05),
        ...doseHistoryFor(meds[1], "Ramesh", 14, 0.05, 0.02),
        ...doseHistoryFor(meds[2], "Ramesh", 14, 0.12, 0.03),
        ...doseHistoryFor(meds[3], "Sunita", 14, 0.03, 0.02),
        ...doseHistoryFor(meds[4], "Sunita", 14, 0.05, 0.05),
    ];
    await DoseEvent.insertMany(history);

    await Notification.insertMany([
        {
            family: family._id,
            audience: "caregivers",
            type: "refill_low",
            title: "Refill needed: Metformin 500mg",
            body: "Only 6 doses left for Ramesh (Dad). Time to get a new strip.",
            isRead: false,
        },
        {
            family: family._id,
            audience: "caregivers",
            type: "weekly_digest",
            title: "Weekly adherence digest",
            body: "Last 7 days:\nRamesh (Dad): 86% (18 taken, 2 missed, 1 skipped)\nSunita (Mom): 96% (12 taken, 0 missed, 1 skipped)\n\nHandy to carry along to the next doctor visit.",
            isRead: true,
        },
    ]);

    console.log("\n✅ Seed complete — demo logins:");
    console.log("   caregivers: priya@medmate.demo | arjun@medmate.demo  (password: demo12345)");
    console.log("   members:    ramesh@medmate.demo | sunita@medmate.demo (password: demo12345)");
    await mongoose.disconnect();
};

const bcryptHash = async (plain) => {
    const bcrypt = (await import("bcrypt")).default;
    return bcrypt.hash(plain, 10);
};

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
