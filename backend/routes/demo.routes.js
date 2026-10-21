import { Router } from "express";
import { tick } from "../jobs/scheduler.js";
import { protect, caregiverOnly } from "../middlewares/auth.middleware.js";

const router = Router();

// Demo control room: drive the real scheduler on demand so a reminder or a
// missed-dose escalation can be shown live in the demo video.
// POST /api/demo/tick { forceEscalate?: boolean }
router.post("/tick", protect, caregiverOnly, async (req, res, next) => {
    try {
        if (!req.body.forceEscalate) {
            const result = await tick();
            return res.json({ message: "Scheduler tick ran — due doses materialised, alerts checked.", result });
        }

        // forceEscalate: mark every still-pending dose as overdue and escalate
        // immediately, regardless of the family's grace window.
        const DoseEvent = (await import("../models/doseEvent.model.js")).default;
        const Notification = (await import("../models/notification.model.js")).default;
        const { sendMail } = await import("../utils/mailer.js");

        const pending = await DoseEvent.find({ family: req.user.family, status: "pending" })
            .populate("medication", "name")
            .populate("member", "name");

        let escalated = 0;
        for (const dose of pending) {
            dose.status = "missed";
            dose.escalatedAt = new Date();
            await dose.save();
            escalated += 1;

            const title = `${dose.member?.name || "Member"} missed ${dose.medication?.name || "a dose"}`;
            const body = `The ${dose.timeLabel} dose was not confirmed. Please check in with them.`;
            await Notification.create({
                family: req.user.family,
                audience: "caregivers",
                type: "dose_missed",
                title,
                body,
                meta: { doseEvent: dose._id, medication: dose.medication?._id, member: dose.member?._id },
            });
            await sendMail({ subject: `MedMate: ${title}`, text: `${title}\n\n${body}` });
        }
        res.json({ message: `Escalated ${escalated} pending dose(s) — caregivers alerted.`, escalated });
    } catch (error) {
        next(error);
    }
});

export default router;
